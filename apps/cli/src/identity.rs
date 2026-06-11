use anyhow::{Context as _, Result};
use chrono::{DateTime, Duration, Utc};
use ed25519_dalek::SigningKey;
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use zeroize::Zeroize;

#[derive(Debug, Serialize, Deserialize)]
pub struct Identity {
    pub id: String,
    signing_key_hex: String,
    pub verifying_key_hex: String,
    pub expires_at: DateTime<Utc>,
    pub auto_expire: bool,
    pub zk_chain_id: Option<String>,
    pub zk_commitment: Option<String>,
    pub relay_region: String,
}

impl Identity {
    pub fn generate(
        ttl_hours: u32,
        persist: bool,
        region: &str,
        link_zk: bool,
        prev_void_id: Option<&str>,
    ) -> Result<Self> {
        let signing_key = SigningKey::generate(&mut OsRng);
        let verifying_key = signing_key.verifying_key();
        let id = format!("ghost_{}", &hex::encode(verifying_key.as_bytes())[..8]);

        // ZK chain handling
        let (zk_chain_id, zk_commitment) = if link_zk {
            let root = void_crypto::zk::load_or_create_zk_root()?;
            let chain = root.new_chain(&id, prev_void_id);
            (Some(chain.chain_id), Some(chain.commitment))
        } else {
            (None, None)
        };

        let identity = Identity {
            id,
            signing_key_hex: hex::encode(signing_key.as_bytes()),
            verifying_key_hex: hex::encode(verifying_key.as_bytes()),
            expires_at: Utc::now() + Duration::hours(ttl_hours as i64),
            auto_expire: !persist,
            zk_chain_id,
            zk_commitment,
            relay_region: region.to_string(),
        };

        identity.save()?;
        Ok(identity)
    }

    pub fn load() -> Result<Self> {
        let path = identity_path()?;
        let data = fs::read_to_string(&path)
            .with_context(|| format!("Cannot read identity at {}", path.display()))?;
        toml::from_str(&data).context("Identity file is corrupted")
    }

    pub fn exists() -> Result<bool> {
        Ok(identity_path()?.exists())
    }

    pub fn is_expired(&self) -> bool {
        Utc::now() > self.expires_at
    }

    pub fn public_key_b64(&self) -> &str {
        &self.verifying_key_hex
    }

    pub fn ttl_remaining(&self) -> chrono::Duration {
        self.expires_at - Utc::now()
    }

    fn save(&self) -> Result<()> {
        let path = identity_path()?;
        fs::create_dir_all(path.parent().unwrap()).context("Cannot create ~/.vpush directory")?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let file = fs::File::create(&path)?;
            file.set_permissions(fs::Permissions::from_mode(0o600))?;
        }

        let toml_str = toml::to_string_pretty(self).context("Failed to serialize identity")?;
        fs::write(&path, toml_str).context("Failed to write identity file")?;
        Ok(())
    }

    pub fn secure_wipe(self, preserve_zk: bool) -> Result<()> {
        let path = identity_path()?;

        if path.exists() {
            let size = fs::metadata(&path)?.len() as usize;
            // 3-pass overwrite
            fs::write(&path, vec![0x00u8; size])?;
            fs::write(&path, vec![0xFFu8; size])?;
            let random: Vec<u8> = (0..size).map(|_| rand::random::<u8>()).collect();
            fs::write(&path, &random)?;
            fs::remove_file(&path)?;
        }

        // Wipe ZK root too unless --preserve-zk
        if !preserve_zk {
            let zk_path = vpush_home_dir()?.join("zk-root");
            if zk_path.exists() {
                let size = fs::metadata(&zk_path)?.len() as usize;
                fs::write(&zk_path, vec![0u8; size])?;
                fs::remove_file(&zk_path)?;
            }
        }

        Ok(())
    }
}

impl Drop for Identity {
    fn drop(&mut self) {
        self.signing_key_hex.zeroize();
    }
}

fn identity_path() -> Result<PathBuf> {
    Ok(vpush_home_dir()?.join("identity"))
}

fn vpush_home_dir() -> Result<PathBuf> {
    if let Some(path) = std::env::var_os("VPUSH_HOME") {
        return Ok(PathBuf::from(path));
    }

    Ok(dirs::home_dir()
        .context("Cannot find home directory")?
        .join(".vpush"))
}
