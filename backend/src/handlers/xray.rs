use axum::{http::StatusCode, Json};
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use x25519_dalek::{PublicKey, StaticSecret};

#[derive(Debug, Serialize, Deserialize)]
pub struct RealityKeysResponse {
    pub private_key: String,
    pub public_key: String,
}

pub async fn generate_reality_keys() -> Result<Json<RealityKeysResponse>, StatusCode> {
    // 1. Generate random private key (microseconds)
    let private_key = StaticSecret::random_from_rng(rand::thread_rng());

    // 2. Derive public key from private key
    let public_key = PublicKey::from(&private_key);

    // 3. Encode to standard Base64 (Xray-compatible format)
    let private_key_str = general_purpose::STANDARD.encode(private_key.to_bytes());
    let public_key_str = general_purpose::STANDARD.encode(public_key.as_bytes());

    tracing::info!("Generated Reality keys natively");

    Ok(Json(RealityKeysResponse {
        private_key: private_key_str,
        public_key: public_key_str,
    }))
}
