use axum::{extract::State, http::StatusCode, response::Json};
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;
use tracing::{error, info};

use crate::{
    onion::{peel_layer, validate_packet_size, OnionPacket},
    state::AppState,
};

/// GET /health
pub async fn health(State(state): State<Arc<AppState>>) -> Json<Value> {
    Json(json!({
        "ok": true,
        "relay_id": state.relay_id,
        "region": state.region,
        "uptime_secs": state.start_time.elapsed().as_secs(),
    }))
}

/// GET /relay/ping
pub async fn ping(State(state): State<Arc<AppState>>) -> Json<Value> {
    Json(json!({
        "relay_id": state.relay_id,
        "pong": true,
        "ts": chrono::Utc::now().to_rfc3339(),
    }))
}

/// GET /relay/info — public relay metadata
pub async fn relay_info(State(state): State<Arc<AppState>>) -> Json<Value> {
    Json(json!({
        "relay_id": state.relay_id,
        "region": state.region,
        "public_key": hex::encode(state.public_key),
        "x25519_public_key": hex::encode(state.public_key),
        "version": "0.1.0",
        "max_payload_bytes": state.max_payload_bytes,
    }))
}

/// POST /relay/forward — receive and forward an onion packet
pub async fn forward(
    State(state): State<Arc<AppState>>,
    Json(packet): Json<OnionPacket>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    // Validate size
    if let Err(e) = validate_packet_size(&packet, state.max_payload_bytes) {
        error!("Packet too large: {}", e);
        return Err((
            StatusCode::PAYLOAD_TOO_LARGE,
            Json(json!({ "error": e.to_string() })),
        ));
    }

    // Peel one onion layer
    let inner = match peel_layer(&packet, &state.private_key) {
        Ok(inner) => inner,
        Err(e) => {
            error!("Failed to peel onion layer: {}", e);
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "Failed to decrypt packet" })),
            ));
        }
    };

    match inner.next_hop {
        Some(next_hop_url) => {
            // Intermediate relay — deserialize inner packet and forward
            info!("Forwarding to next hop: {}", next_hop_url);
            let next_packet: OnionPacket = match serde_json::from_slice(&inner.payload) {
                Ok(p) => p,
                Err(e) => {
                    error!("Failed to deserialize next packet: {}", e);
                    return Err((
                        StatusCode::BAD_REQUEST,
                        Json(json!({ "error": "Malformed inner packet" })),
                    ));
                }
            };

            if let Err(e) = state
                .forwarder
                .forward_with_retry(&next_hop_url, &next_packet)
                .await
            {
                error!("Failed to forward to {}: {}", next_hop_url, e);
                return Err((
                    StatusCode::BAD_GATEWAY,
                    Json(json!({ "error": "Failed to reach next relay" })),
                ));
            }
        }
        None => {
            // Exit relay — parse and push final git payload
            info!("Exit relay: pushing to git remote");

            #[derive(Deserialize)]
            struct GitPayload {
                remote_url: String,
                branch: String,
                git_data: Vec<u8>,
                force: bool,
            }

            let git_payload: GitPayload = match serde_json::from_slice(&inner.payload) {
                Ok(p) => p,
                Err(e) => {
                    error!("Failed to parse git payload: {}", e);
                    return Err((
                        StatusCode::BAD_REQUEST,
                        Json(json!({ "error": "Malformed git payload" })),
                    ));
                }
            };

            if let Err(e) = state
                .forwarder
                .push_to_git_remote(
                    &git_payload.remote_url,
                    &git_payload.branch,
                    &git_payload.git_data,
                    git_payload.force,
                )
                .await
            {
                error!("git push failed: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": "git push failed" })),
                ));
            }
        }
    }

    Ok(Json(json!({ "ok": true })))
}
