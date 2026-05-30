use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage, HttpResponse,
};
use futures::future::LocalBoxFuture;
use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

#[derive(Clone)]
pub struct RateLimitConfig {
    pub requests_per_minute: u32,
    pub requests_per_hour: u32,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            requests_per_minute: 60,
            requests_per_hour: 1000,
        }
    }
}

pub struct RateLimitMiddleware {
    config: RateLimitConfig,
    state: Arc<Mutex<RateLimitState>>,
}

struct RateLimitState {
    minute_buckets: HashMap<String, Vec<Instant>>,
    hour_buckets: HashMap<String, Vec<Instant>>,
}

impl RateLimitMiddleware {
    pub fn new(config: RateLimitConfig) -> Self {
        Self {
            config,
            state: Arc::new(Mutex::new(RateLimitState {
                minute_buckets: HashMap::new(),
                hour_buckets: HashMap::new(),
            })),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for RateLimitMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = RateLimitMiddlewareService<S>;
    type Future = std::future::Ready<Result<Self::Transform, Self::InitError>>;

    fn new_service(&self, service: S) -> Self::Future {
        std::future::ready(Ok(RateLimitMiddlewareService {
            service,
            config: self.config.clone(),
            state: self.state.clone(),
        }))
    }
}

pub struct RateLimitMiddlewareService<S> {
    service: S,
    config: RateLimitConfig,
    state: Arc<Mutex<RateLimitState>>,
}

impl<S, B> Service<ServiceRequest> for RateLimitMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let client_ip = req
            .connection_info()
            .peer_addr()
            .unwrap_or("unknown")
            .to_string();

        let config = self.config.clone();
        let state = self.state.clone();

        let mut state_guard = state.lock().unwrap();
        let now = Instant::now();

        // Check minute limit
        let minute_key = format!("{}:minute", client_ip);
        let minute_requests = state_guard
            .minute_buckets
            .entry(minute_key.clone())
            .or_insert_with(Vec::new);

        minute_requests.retain(|t| now.duration_since(*t) < Duration::from_secs(60));

        if minute_requests.len() >= config.requests_per_minute as usize {
            drop(state_guard);
            return Box::pin(async move {
                Err(actix_web::error::ErrorTooManyRequests(
                    "Rate limit exceeded: 60 requests per minute",
                ))
            });
        }

        // Check hour limit
        let hour_key = format!("{}:hour", client_ip);
        let hour_requests = state_guard
            .hour_buckets
            .entry(hour_key.clone())
            .or_insert_with(Vec::new);

        hour_requests.retain(|t| now.duration_since(*t) < Duration::from_secs(3600));

        if hour_requests.len() >= config.requests_per_hour as usize {
            drop(state_guard);
            return Box::pin(async move {
                Err(actix_web::error::ErrorTooManyRequests(
                    "Rate limit exceeded: 1000 requests per hour",
                ))
            });
        }

        minute_requests.push(now);
        hour_requests.push(now);
        drop(state_guard);

        let service = self.service.clone();
        Box::pin(async move {
            let res = service.call(req).await?;
            let mut response = res;
            response.headers_mut().insert(
                actix_web::http::header::HeaderName::from_static("x-ratelimit-limit-minute"),
                actix_web::http::header::HeaderValue::from_static("60"),
            );
            response.headers_mut().insert(
                actix_web::http::header::HeaderName::from_static("x-ratelimit-limit-hour"),
                actix_web::http::header::HeaderValue::from_static("1000"),
            );
            Ok(response)
        })
    }
}
