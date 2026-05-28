# VoidPush Security Audit — Threat Model & Checklist
> Internal document · Phase 3 · Pre-public-launch

---

## Threat Model

### Adversaries

| Adversary | Capability | Goal |
|---|---|---|
| **Passive network observer** | Can see all relay-to-relay traffic | De-anonymise pushes via traffic analysis |
| **Malicious relay operator** | Controls 1–2 relay nodes | Learn source IP or destination |
| **Malicious reviewer** | Can submit reviews | Manipulate scores, identify ghosts |
| **Score engine operator** | Full DB access | Link ghost IDs to real identities |
| **Global passive adversary** | Observes all internet traffic | Timing correlation attack |

### Assets to protect

1. **Ghost identity** — real-world developer identity must not be linkable to a void_id
2. **Source IP** — must not reach the destination git remote
3. **Reviewer identity** — reviewers must remain anonymous to code authors
4. **Push content** — intermediate relays must not read the code being pushed

---

## Security Properties Matrix

| Attack | Mitigated? | How | Residual Risk |
|---|---|---|---|
| Source IP correlation | ✅ | Multi-hop relay, entry relay stripped | Exit relay sees dest only |
| Author identity via git metadata | ✅ | Client-side metadata stripping | Timing of push itself |
| Reviewer identity linkage | ✅ | One-time review tokens, no persistent identity | Token reuse across sessions (rate-limited) |
| Score manipulation | ✅ | Minimum 2 reviewers, aggregation, rate limiting | Coordinated Sybil attack |
| Relay compromise (1 node) | ✅ | Onion encryption, ECDH per hop | Compromised exit knows destination |
| Relay compromise (all nodes) | ❌ | Not protected against global adversary | Use traffic mixing (v2) |
| ZK proof forgery | ⚠️ | Simplified Schnorr — needs upgrade | Pre-image attack on SHA-256 |
| Timing correlation | ⚠️ | 3-hop minimum adds latency | Global passive adversary |
| Ghost ID enumeration | ✅ | IDs are hashed public keys, not sequential | Brute-force 2^32 (infeasible) |

---

## Audit Checklist

### Cryptographic

- [ ] **ECDH key derivation**: Replace `shared_secret.as_bytes()` with `HKDF-SHA256(shared_secret, "void-relay-v1", "")`
- [ ] **ChaCha20-Poly1305 nonce uniqueness**: Verify nonces are never reused per key. Current: random 12-byte nonce. Risk: 2^-96 collision probability per key lifetime (acceptable for ephemeral keys)
- [ ] **Ed25519 key generation**: Verify OsRng is properly seeded on all target platforms (Windows, Linux, macOS)
- [ ] **ZK proof upgrade**: Replace simplified Schnorr with Bulletproofs or Pedersen commitment + Sigma protocol over Ristretto255
- [ ] **Memory zeroing**: Verify `Zeroize` drops are called on all secret key material. Audit for copies via `clone()` that bypass zeroize
- [ ] **Constant-time comparison**: Ensure all HMAC/proof comparisons use `subtle::ConstantTimeEq` to prevent timing attacks

### Transport

- [ ] **TLS validation**: Relay-to-relay connections must validate TLS certificates. No `danger_accept_invalid_certs`
- [ ] **Packet replay protection**: Add `timestamp` field to `OnionPacket` with 30s tolerance window. Reject replayed packets
- [ ] **Max payload enforcement**: Verify `MAX_PAYLOAD_BYTES` check occurs before decryption (DoS prevention)
- [ ] **Connection limits**: Per-IP connection rate limiting on relay nodes
- [ ] **Relay authentication**: Relays should authenticate to each other via certificate pinning or registry-signed tokens

### Score Engine

- [ ] **SQL injection**: SQLAlchemy ORM with parameterised queries — verify no raw SQL strings
- [ ] **Rate limiting Redis failover**: Verify `fail open` behaviour is intentional and acceptable
- [ ] **Review token entropy**: Verify `secrets.token_hex(32)` = 256 bits — sufficient
- [ ] **Bulk review spam**: Rate limiting per token + per void_id. Add IP-based limit as secondary layer
- [ ] **ZK proof verification completeness**: Current verifier checks challenge hash only — needs full Schnorr verification
- [ ] **Database privacy**: Verify no real IP addresses, emails, or real names are stored anywhere
- [ ] **Audit log signing**: Implement ed25519 signing in `audit_log.py` (currently stubbed as `"TODO:ed25519"`)

### CLI

- [ ] **Key file permissions**: `~/.vpush/identity` set to mode 0600 on Unix. Windows ACL equivalent
- [ ] **Secure wipe verification**: Test 3-pass wipe against filesystem journal recovery. Consider `O_DIRECT` for wipe writes
- [ ] **`git2` memory safety**: Audit for panics on malformed repo state
- [ ] **Environment variable leakage**: Verify `GIT_AUTHOR_EMAIL` override can't be bypassed by git hooks
- [ ] **Binary reproducibility**: CI release builds should produce identical binaries from identical source (deterministic build)

### Web App

- [ ] **CSP headers**: Add `Content-Security-Policy` to Next.js headers in `next.config.mjs`
- [ ] **No user data in URLs**: Verify void_id never appears in browser history/URLs
- [ ] **Waitlist email storage**: Encrypt emails at rest. Auto-delete after invite sent
- [ ] **No analytics fingerprinting**: Verify no third-party scripts that could de-anonymise users

---

## Recommended Third-Party Audits

| Scope | Recommended firm | Timeline |
|---|---|---|
| Cryptographic protocol | Trail of Bits or Cure53 | Phase 3 |
| Relay network | NCC Group | Phase 3 |
| Web app + API | Cobalt.io (pentest) | Phase 3 |
| CLI binary | Audit3 or manual review | Before v1.0 |

---

## CVE Response Process

1. Report to: security@voidpush.dev
2. PGP key: published at https://voidpush.dev/.well-known/security.txt
3. Response SLA: 48h acknowledgment, 7d triage, 30d patch
4. Disclosure policy: coordinated disclosure, 90-day embargo
5. Bug bounty: planned for Phase 4

---

*This document is internal. Do not publish before audit completion.*
