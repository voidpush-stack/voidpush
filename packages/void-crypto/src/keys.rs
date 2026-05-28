use anyhow::Result;
use ed25519_dalek::SigningKey;
use rand::rngs::OsRng;
use zeroize::Zeroize;

pub struct VoidKeypair {
    pub signing_key:   SigningKey,
    pub void_id:      String,
}

impl VoidKeypair {
    pub fn public_key_hex(&self) -> String {
        hex::encode(self.signing_key.verifying_key().as_bytes())
    }
}

impl Drop for VoidKeypair {
    fn drop(&mut self) {
        // signing key zeroizes itself via ed25519-dalek's Zeroize impl
    }
}

pub fn generate_keypair() -> Result<VoidKeypair> {
    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let id = format!(
        "ghost_{}",
        &hex::encode(signing_key.verifying_key().as_bytes())[..8]
    );
    Ok(VoidKeypair { signing_key, void_id: id })
}
