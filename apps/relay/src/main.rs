use anyhow::Result;
use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing::info;
use tracing_subscriber::{fmt, EnvFilter};

mod config;
mod onion;
mod forwarder;
mod handlers;
mod state;

use state::AppState;

#[tokio::main]
async fn main() -> Result<()> {
    fmt()
        .with_env_filter(EnvFilter::from_default_env()
            .add_directive("void_relay=info".parse()?))
        .with_target(false)
        .init();

    let cfg = config::Config::from_env()?;
    let state = Arc::new(AppState::new(&cfg).await?);

    let app = Router::new()
        // Health check
        .route("/health",          get(handlers::health))
        // Relay endpoints
        .route("/relay/forward",   post(handlers::forward))
        .route("/relay/info",      get(handlers::relay_info))
        // Registry ping
        .route("/relay/ping",      get(handlers::ping))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", cfg.port);
    info!("void-relay listening on {}", addr);
    info!("relay_id={} region={}", cfg.relay_id, cfg.region);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
