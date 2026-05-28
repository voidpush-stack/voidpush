/// Onion routing layer for the VoidPush relay network.
///
/// Each relay receives a payload encrypted in layers:
///   encrypt(relay_n_pubkey, encrypt(relay_n-1_pubkey, ... encrypt(relay_1_pubkey, payload)))
///
/// Each relay:
///   1. Decrypts one layer using its private key (X25519 ECDH + ChaCha20-Poly1305)
///   2. Reads the next-hop address from the inner header
///   3. Forwards the remaining ciphertext to the next relay
///   4. The final relay pushes to the real git remote

use anyhow::{bail, Context, Result};
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Nonce,
};
use serde::{Deserialize, Serialize};
use x25519_dalek::{EphemeralSecret, PublicKey, StaticSecret};

/// Wire format for an onion-wrapped payload
#[derive(Debug, Serialize, Deserialize)]
pub struct OnionPacket {
    /// Ephemeral sender public key (X25519) — needed for ECDH shared secret
    pub ephemeral_pubkey: [u8; 32],
    /// ChaCha20-Poly1305 nonce (12 bytes)
    pub nonce: [u8; 12],
    /// Encrypted inner payload
    pub ciphertext: Vec<u8>,
}

/// Decrypted inner layer — either forwards to next hop or is the final payload
#[derive(Debug, Serialize, Deserialize)]
pub struct InnerLayer {
    /// Next relay to forward to, or None if this is the exit relay
    pub next_hop: Option<String>,
    /// Remaining onion packet (for forwarding) or final git payload (at exit)
    pub payload: Vec<u8>,
}

/// Decrypt one onion layer using this relay's X25519 static private key
pub fn peel_layer(packet: &OnionPacket, our_private_key: &StaticSecret) -> Result<InnerLayer> {
    // Reconstruct sender's ephemeral public key
    let ephemeral_pubkey = PublicKey::from(packet.ephemeral_pubkey);

    // ECDH: compute shared secret
    let shared_secret = our_private_key.diffie_hellman(&ephemeral_pubkey);

    // Derive ChaCha20 key from shared secret (use raw bytes — in prod use HKDF)
    let cipher = ChaCha20Poly1305::new_from_slice(shared_secret.as_bytes())
        .context("Failed to init cipher from shared secret")?;

    let nonce = Nonce::from_slice(&packet.nonce);

    // Decrypt
    let plaintext = cipher
        .decrypt(nonce, packet.ciphertext.as_slice())
        .map_err(|_| anyhow::anyhow!("Decryption failed — wrong key or corrupted packet"))?;

    // Deserialize inner layer
    let inner: InnerLayer = serde_json::from_slice(&plaintext)
        .context("Failed to deserialize inner layer")?;

    Ok(inner)
}

/// Wrap a payload in one onion layer (used by CLI, not relay)
pub fn wrap_layer(
    inner: &InnerLayer,
    recipient_pubkey: &PublicKey,
) -> Result<OnionPacket> {
    let plaintext = serde_json::to_vec(inner)
        .context("Failed to serialize inner layer")?;

    // Generate ephemeral keypair for this layer
    let ephemeral_secret = EphemeralSecret::random_from_rng(rand::rngs::OsRng);
    let ephemeral_pubkey = PublicKey::from(&ephemeral_secret);

    // ECDH
    let shared_secret = ephemeral_secret.diffie_hellman(recipient_pubkey);

    let cipher = ChaCha20Poly1305::new_from_slice(shared_secret.as_bytes())
        .context("Failed to init cipher")?;

    // Random nonce
    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_slice())
        .map_err(|_| anyhow::anyhow!("Encryption failed"))?;

    Ok(OnionPacket {
        ephemeral_pubkey: ephemeral_pubkey.to_bytes(),
        nonce: nonce_bytes,
        ciphertext,
    })
}

/// Validate packet size — reject oversized payloads before decryption
pub fn validate_packet_size(packet: &OnionPacket, max_bytes: usize) -> Result<()> {
    let size = packet.ciphertext.len() + 32 + 12; // ciphertext + pubkey + nonce
    if size > max_bytes {
        bail!("Packet too large: {} bytes (max {})", size, max_bytes);
    }
    Ok(())
}
