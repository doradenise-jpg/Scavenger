mod services;
mod middleware;

use actix_web::{web, App, HttpServer, HttpResponse};
use services::{
    EmailService, SendGridEmailService, NotificationService, FirebaseNotificationService,
    ReportService, ReportingService, StorageService, S3StorageService,
    WebhookManager, ExportService,
};
use middleware::{RateLimitMiddleware, RateLimitConfig};
use std::sync::Arc;
use tracing::info;
use tracing_subscriber::{fmt, EnvFilter, prelude::*};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Structured JSON logging: LOG_FORMAT=json for production, pretty for dev
    let use_json = std::env::var("LOG_FORMAT")
        .map(|v| v.to_lowercase() == "json")
        .unwrap_or(false);

    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    if use_json {
        tracing_subscriber::registry()
            .with(filter)
            .with(fmt::layer().json().with_current_span(true))
            .init();
    } else {
        tracing_subscriber::registry()
            .with(filter)
            .with(fmt::layer().pretty())
            .init();
    }

    info!(service = "backend", "Starting Scavenger Backend Server on 0.0.0.0:8080");

    let email_service = Arc::new(SendGridEmailService::new(
        std::env::var("SENDGRID_API_KEY").unwrap_or_default(),
        std::env::var("FROM_EMAIL").unwrap_or_else(|_| "noreply@scavenger.io".to_string()),
    ));

    let notification_service = Arc::new(FirebaseNotificationService::new(
        std::env::var("FIREBASE_PROJECT_ID").unwrap_or_default(),
    ));

    let reporting_service = Arc::new(ReportingService::new(
        std::env::var("STORAGE_PATH").unwrap_or_else(|_| "/tmp".to_string()),
    ));

    let storage_service = Arc::new(S3StorageService::new(
        std::env::var("S3_BUCKET").unwrap_or_default(),
        std::env::var("AWS_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
    ));

    let webhook_manager = Arc::new(WebhookManager::new());
    let rate_limit_config = RateLimitConfig::default();

    HttpServer::new(move || {
        App::new()
            .wrap(RateLimitMiddleware::new(rate_limit_config.clone()))
            .app_data(web::Data::new(email_service.clone()))
            .app_data(web::Data::new(notification_service.clone()))
            .app_data(web::Data::new(reporting_service.clone()))
            .app_data(web::Data::new(storage_service.clone()))
            .app_data(web::Data::new(webhook_manager.clone()))
            .route("/health", web::get().to(health_check))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
