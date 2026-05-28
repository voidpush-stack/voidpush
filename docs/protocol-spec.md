# VoidPush Protocol Specification
> v0.1.0 · Open Standard

---

## Abstract

The VoidPush Protocol defines a system for anonymous code contribution with pseudonymous reputation. It provides cryptographic anonymity at the transport and identity layers while maintaining public accountability through blind code review and verifiable audit logs.

---

## 1. Identity Layer

### 1.1 Ghost Identity

A ghost identity consists of:

| Field | Type | Description |
|---|---|---|
| `void_id` | `string` | Human-readable ID: `"ghost_" + hex(pubkey)[0:8]` |
| `public_key` | `[u8; 32]` | Ed25519 verifying key |
| `expires_at` | `u64` | Unix timestamp (TTL default: 72h) |
| `zk_chain_id` | `string?` | Optional ZK reputation chain linkage |

### 1.2 Keypair Generation

```
signing_key  = Ed25519::generate(OsRng)
verifying_key = signing_key.verifying_key()
void_id     = "ghost_" || hex(sha256(verifying_key))[0:8]
```

### 1.3 Identity Expiry

Identities expire after TTL hours. On expiry:
1. 3-pass overwrite of key material (zeros, ones, random)
2. Deletion of identity file from `~/.vpush/identity`
3. Deletion of relay cache from `~/.vpush/relay-cache`

ZK root (`~/.vpush/zk-root`) may be preserved across sessions via `--preserve-zk`.

---

## 2. Transport Layer

### 2.1 Relay Chain Construction

A relay chain consists of N relay nodes (min 3, max 9) selected by:

1. Filter: trust_score ≥ 7.0
2. Filter: no two nodes same country
3. Filter: no two nodes same cloud provider
4. Sort: ascending latency
5. Select: first N

### 2.2 Onion Encryption

Each push payload is encrypted in layers — innermost layer first:

```
payload_n   = { next_hop: null, data: git_payload }
cipher_n    = ChaCha20Poly1305::encrypt(ecdh(R_n.pubkey), payload_n)
onion_{n}   = OnionPacket { ephemeral_pubkey, nonce, ciphertext: cipher_n }

payload_{n-1} = { next_hop: R_n.url, data: onion_n }
cipher_{n-1}  = ChaCha20Poly1305::encrypt(ecdh(R_{n-1}.pubkey), payload_{n-1})
...
```

**ECDH key derivation:**
```
shared_secret = X25519(our_ephemeral_secret, relay_static_pubkey)
cipher_key    = shared_secret.as_bytes()  // 32 bytes, direct use
```

*Note: Production upgrade path uses HKDF-SHA256 for key derivation.*

### 2.3 Relay Processing

Each relay node:

1. Validates packet size ≤ `MAX_PAYLOAD_BYTES`
2. Decrypts one layer: `plaintext = ChaCha20Poly1305::decrypt(ecdh(our_privkey, ephemeral_pubkey), ciphertext)`
3. Deserialises `InnerLayer { next_hop, payload }`
4. If `next_hop != null`: forward `payload` as new `OnionPacket` to `next_hop`
5. If `next_hop == null`: this is the exit relay — perform git push

### 2.4 Metadata Stripping

Before any packet is constructed, the ghost CLI strips from all commits:

| Field | Method |
|---|---|
| `author.name` | Replace with `void_id` |
| `author.email` | Replace with `anon@voidpush.null` |
| `committer.name` | Replace with `void_id` |
| `committer.email` | Replace with `anon@voidpush.null` |
| `author.timestamp` | Zero (if `--strip-timestamps`) |
| `committer.timestamp` | Zero (if `--strip-timestamps`) |
| File paths in diff | Normalised |
| Machine hostname | Not included in git objects (no-op) |

**Stripping is performed client-side before the payload is encrypted.** The exit relay receives already-stripped commit objects.

---

## 3. Reputation Layer

### 3.1 Blind Review Protocol

1. Ghost pushes code → registers `push_hash` with score engine
2. Score engine opens a 24h review window
3. Reviewers receive: diff only (no author, no void_id, no repo URL)
4. Reviewers submit: `{ readability, correctness, style, feedback? }`
5. Score engine aggregates: weighted average (correctness 40%, readability 35%, style 25%)
6. Score is attributed to `void_id` via `push_hash`

### 3.2 ZK Reputation Linking

**Problem:** Ephemeral identities prevent reputation accumulation.

**Solution:** ZK chain linking.

When a void initialises with `--link`:
1. Load or generate a persistent ZK root secret (`~/.vpush/zk-root`)
2. Derive `chain_id = sha256(root_secret)[0:16]` (hex)
3. Derive `commitment = sha256(root_secret || void_id)` (hex)
4. Generate Schnorr-style proof: `(challenge, response, nonce_commitment)`
5. Submit `(chain_id, commitment, proof)` alongside each scored push

**Proof structure:**
```
nonce           = random([u8; 32])
nonce_commitment = hex(sha256(nonce))
challenge        = hex(sha256(nonce_commitment || void_id || chain_id))
response         = nonce XOR (root_secret * challenge_bytes)
```

**Verification (score engine):**
```
expected_challenge = sha256(proof.nonce_commitment || void_id || chain_id)
valid = (proof.challenge == expected_challenge)
     && is_valid_hex(commitment)
     && len(commitment) >= 32
```

Score engine aggregates scores across sessions sharing the same `chain_id`.

### 3.3 Score Formula

```
overall = (correctness * 0.40) + (readability * 0.35) + (style * 0.25)
score   = round(overall, 1)  // 0.0 – 10.0
```

### 3.4 Leaderboard Ranking

Rankings are computed daily:
- Weekly: all `VoidScore` records from last 7 days
- All-time: all records ever
- Tie-breaking: reviewer_count (more reviews = more reliable score)

---

## 4. Wire Format

### 4.1 OnionPacket

```rust
struct OnionPacket {
    ephemeral_pubkey: [u8; 32],  // X25519 public key
    nonce:            [u8; 12],  // ChaCha20-Poly1305 nonce
    ciphertext:       Vec<u8>,   // Encrypted InnerLayer
}
```

Serialised as JSON over HTTPS (upgrade path: binary MessagePack).

### 4.2 InnerLayer

```rust
struct InnerLayer {
    next_hop: Option<String>,  // URL of next relay, or null for exit
    payload:  Vec<u8>,         // Serialised OnionPacket or git payload
}
```

### 4.3 GitPayload (exit relay)

```rust
struct GitPayload {
    remote_url: String,   // Target git remote URL
    branch:     String,   // Branch to push
    git_data:   Vec<u8>,  // git pack-objects output
    force:      bool,     // Force push flag
}
```

---

## 5. Security Properties

| Property | Status |
|---|---|
| Source IP hidden from destination | ✅ Multi-hop relay |
| Author identity hidden from reviewers | ✅ Blind review |
| Reviewer identity hidden from authors | ✅ One-time tokens |
| Payload content hidden from relays | ✅ Onion encryption |
| Correlation across sessions prevented | ✅ Ephemeral IDs + ZK linking |
| Timing correlation resistance | ⚠️ Partial (min 3 hops, no mixing) |
| Exit relay knows destination | ⚠️ By design (must push to real remote) |
| Trust anchoring | ✅ Cryptographic audit log |

### 5.1 Known limitations

- **Exit relay awareness:** The exit relay knows the destination git remote URL. It does not know the source IP or ghost identity.
- **Timing attacks:** A global passive adversary observing all relay nodes could correlate traffic by timing. Mitigated by hop count but not eliminated. Traffic mixing is on the roadmap.
- **ZK proof strength:** The current Schnorr-style proof is a simplified implementation. Production upgrade path uses proper prime-order group arithmetic with Bulletproofs.

---

## 6. Versioning

Protocol versions are `MAJOR.MINOR`. Breaking changes increment MAJOR.

| Version | Status | Changes |
|---|---|---|
| 0.1.0 | current | Initial release |

---

## 7. Reference Implementation

- CLI: `apps/cli` (Rust)
- Relay node: `apps/relay` (Rust/Axum)
- Score engine: `apps/score-engine` (Python/FastAPI)
- Shared crypto: `packages/void-crypto` (Rust)

---

*VoidPush Protocol · MIT License · https://voidpush.dev/docs/protocol*
