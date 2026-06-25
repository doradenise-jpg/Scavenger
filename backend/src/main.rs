mod services;
mod middleware;
mod api;
mod cache;
mod validation;

use actix_web::{web, App, HttpServer, HttpResponse};
use services::{
    EmailService, SendGridEmailService, NotificationService, FirebaseNotificationService,
    ReportService, ReportingService, StorageService, S3StorageService,
    WebhookManager, ExportService, AuditService,
};
use middleware::{RateLimitMiddleware, RateLimitConfig};
use cache::Cache;
use api::{contracts, ws, export, audit};
use std::sync::Arc;
use tracing::info;
use tracing_subscriber::{fmt, EnvFilter, prelude::*};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
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

    let email_service: Arc<dyn EmailService> = Arc::new(SendGridEmailService::new(
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
    let cache = Cache::new(300);
    let audit_service = AuditService::new();
    let ws_manager = ws::WsConnectionManager::new();

    info!(
        cache_ttl = 300,
        "Cache layer initialized with 5-minute default TTL"
    );
    info!("Audit service initialized");
    info!("WebSocket manager initialized");

    HttpServer::new(move || {
        App::new()
            .wrap(RateLimitMiddleware::new(rate_limit_config.clone()))
            .app_data(web::Data::new(email_service.clone()))
            .app_data(web::Data::new(notification_service.clone()))
            .app_data(web::Data::new(reporting_service.clone()))
            .app_data(web::Data::new(storage_service.clone()))
            .app_data(web::Data::new(webhook_manager.clone()))
            .app_data(web::Data::new(cache.clone()))
            .app_data(web::Data::new(audit_service.clone()))
            .app_data(web::Data::new(ws_manager.clone()))
            // Health
            .route("/health", web::get().to(health_check))
            // Contract Queries (Task 1)
            .route("/api/v1/contracts/wastes", web::get().to(contracts::list_wastes))
            .route("/api/v1/contracts/wastes/{id}", web::get().to(contracts::get_waste))
            .route("/api/v1/contracts/participants", web::get().to(contracts::list_participants))
            .route("/api/v1/contracts/participants/{id}", web::get().to(contracts::get_participant))
            .route("/api/v1/contracts/stats", web::get().to(contracts::get_contract_stats))
            .route("/api/v1/contracts/info", web::get().to(contracts::get_contract_info))
            .route("/api/v1/cache/invalidate/waste/{id}", web::post().to(contracts::invalidate_waste_cache))
            .route("/api/v1/cache/invalidate/all", web::post().to(contracts::invalidate_all_cache))
            // WebSocket (Task 2)
            .route("/ws", web::get().to(ws::ws_handler))
            .route("/ws/health", web::get().to(ws::ws_health))
            // Export (Task 3)
            .route("/api/v1/exports", web::post().to(export::export_data))
            .route("/api/v1/exports", web::get().to(export::list_exports))
            .route("/api/v1/exports/{id}/download", web::get().to(export::download_export))
            .route("/api/v1/exports/{id}/email", web::post().to(export::send_export_email))
            .route("/api/v1/exports/scheduled", web::post().to(export::create_scheduled_export))
            .route("/api/v1/exports/scheduled", web::get().to(export::list_scheduled_exports))
            .route("/api/v1/exports/scheduled/{id}", web::delete().to(export::delete_scheduled_export))
            // Audit (Task 4)
            .route("/api/v1/audit/logs", web::get().to(audit::list_audit_logs))
            .route("/api/v1/audit/logs/{id}", web::get().to(audit::get_audit_entry))
            .route("/api/v1/audit/summary", web::get().to(audit::get_audit_summary))
            .route("/api/v1/audit/report", web::post().to(audit::generate_audit_report))
            .route("/api/v1/audit/export", web::get().to(audit::export_audit_logs))
            .route("/api/v1/audit/alerts", web::post().to(audit::create_alert_rule))
            .route("/api/v1/audit/alerts", web::get().to(audit::list_alert_rules))
            .route("/api/v1/audit/retention", web::get().to(audit::get_retention_policy))
            .route("/api/v1/audit/retention", web::put().to(audit::update_retention_policy))
            .route("/api/v1/audit/purge", web::post().to(audit::purge_old_logs))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "version": "1.0.0",
        "services": ["contracts", "websocket", "export", "audit", "cache"]
    }))
}
