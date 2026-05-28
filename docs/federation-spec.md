# VoidPush Federation Specification
> v0.1.0 · Community Relay Node Standard

---

## Overview

The VoidPush Federation Specification defines how community-operated relay nodes join and participate in the VoidPush network. Any operator can run a relay node by following this spec and passing the verification process.

**Goals:**
- Decentralise the relay network so it can exist without VoidPush Inc.
- Maintain security and anonymity guarantees across all nodes
- Provide a trust framework that routes around malicious or degraded nodes

---

## Relay node requirements

### Hardware minimums
| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 512MB | 2GB |
| Storage | 10GB SSD | 50GB SSD |
| Bandwidth | 100Mbps | 1Gbps |
| Static IP | Required | Required |
| Uptime SLA | 99.0% | 99.9% |

### Network requirements
- Port 8000 open (relay protocol)
- Port 443 open (TLS termination)
- IPv4 static address required
- IPv6 recommended
- Must NOT be behind Cloudflare or similar MITM proxy
- Must be in a jurisdiction different from at least 2 other relay nodes in any chain

### Software requirements
- void-relay binary v0.1.0+
- TLS certificate (Let's Encrypt is fine)
- NTP time sync (±1 second tolerance)
- Kernel: Linux 5.15+ recommended

---

## Registration process

### 1. Generate relay keypair
```bash
void-relay keygen --output /etc/void-relay/keys/
```

This generates an X25519 keypair. The public key is submitted during registration. **Never share the private key.**

### 2. Run the relay in test mode
```bash
RELAY_ID=pending \
RELAY_REGION=eu \
RELAY_PRIVATE_KEY=$(cat /etc/void-relay/keys/private.hex) \
void-relay --test-mode
```

Test mode connects to the registry sandbox and runs a 24-hour verification suite.

### 3. Submit registration
POST to `https://registry.voidpush.dev/relay/register`:

```json
{
  "operator_contact": "relay-ops@yourorg.com",
  "public_key_hex": "...",
  "region": "eu",
  "city": "Berlin",
  "country_code": "DE",
  "node_type": "community",
  "infrastructure": {
    "provider": "Hetzner",
    "vps_specs": "CX21 (2 vCPU, 4GB RAM)",
    "bandwidth_mbps": 200
  }
}
```

### 4. Verification
The registry runs automated tests over 72 hours:
- Latency probing every 5 minutes
- Onion packet routing tests (sends test packets through your node)
- TLS certificate validation
- Uptime monitoring
- Cryptographic integrity audit

On pass, your node receives a relay ID (e.g. `R10`) and an initial trust score of **5.0**.

---

## Trust score system

Trust scores are computed every 24 hours from three components:

### Uptime (40%)
Rolling 30-day availability. Below 99.0% = 0 points. Above 99.9% = full points.

```
uptime_score = clamp((uptime_pct - 99.0) / 0.9, 0, 1) * 4.0
```

### Latency (30%)
Measured vs. regional median. Penalty for outliers.

```
latency_score = max(0, 3.0 - (your_latency_ms / regional_median_ms - 1) * 3.0)
```

### Integrity (30%)
Cryptographic audit log verification. Every relay node maintains a signed log of all packets routed (metadata only — no payload content). The registry verifies log signatures daily.

```
integrity_score = 3.0 if logs_valid else 0.0
```

**Total trust score:**
```
trust = uptime_score + latency_score + integrity_score  # max 10.0
```

Nodes below **7.0** are deprioritised. Nodes below **5.0** for 7 consecutive days are suspended.

---

## Relay chain selection algorithm

When a client builds a relay chain, nodes are selected as follows:

1. Filter: only nodes with trust ≥ 7.0
2. Filter: no two nodes from the same country
3. Filter: no two nodes from the same cloud provider
4. Sort by: latency-weighted trust score
5. Select: first N nodes (N = requested hop count, min 3)

Community nodes are eligible for all chains. Core nodes are preferred for the exit hop (final relay) when available.

---

## Audit log format

Every relay node publishes a signed audit log. Entries contain:

```json
{
  "ts":          "2026-05-01T14:22:11Z",
  "relay_id":    "R10",
  "packet_hash": "sha256:abc123...",
  "hop_index":   2,
  "chain_len":   3,
  "forwarded":   true,
  "signature":   "ed25519:..."
}
```

**What is NOT logged:**
- Source IP address
- Destination URL
- Payload content
- Ghost identity

The audit log proves a packet was routed correctly without revealing anything about the push itself.

---

## Operator obligations

By running a VoidPush community relay, you agree to:

1. **Not log payload content.** Only the metadata fields above.
2. **Not attempt to correlate source and destination.** This is a protocol violation.
3. **Promptly apply security updates** within 72 hours of release.
4. **Report any anomalies** (unusual traffic patterns, suspected attacks) to security@voidpush.dev.
5. **Keep contact email current** in the registry.

Violation of obligations results in immediate suspension and removal from the federation.

---

## Relay node configuration reference

```toml
# /etc/void-relay/config.toml

[relay]
id              = "R10"
region          = "eu"
city            = "Berlin"
country_code    = "DE"
node_type       = "community"

[network]
port            = 8000
tls_cert_path   = "/etc/letsencrypt/live/relay.yourorg.com/fullchain.pem"
tls_key_path    = "/etc/letsencrypt/live/relay.yourorg.com/privkey.pem"
max_connections = 1000
max_payload_mb  = 50

[keys]
private_key_path = "/etc/void-relay/keys/private.hex"

[registry]
url             = "https://registry.voidpush.dev"
heartbeat_secs  = 30

[audit_log]
path            = "/var/log/void-relay/audit.jsonl"
rotate_mb       = 100
sign_entries    = true
```

---

## Support

- Federation docs: https://voidpush.dev/docs/federation
- Relay operator chat: https://voidpush.dev/community
- Security issues: security@voidpush.dev (PGP key on keyserver)
- Registry status: https://status.voidpush.dev
