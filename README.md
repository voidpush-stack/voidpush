# 👻 VoidPush

> Anonymous code contribution network. No usernames. No history. No bias. Just pure signal.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-a78bfa)](https://voidpush.dev)
[![CI](https://img.shields.io/github/actions/workflow/status/voidpush-stack/voidpush/ci.yml?label=CI)](https://github.com/voidpush-stack/voidpush/actions)

---

## What is VoidPush?

VoidPush lets you push code, open PRs, and contribute to open source **without revealing your identity**. Your commits are stripped of all metadata client-side, routed through a multi-hop onion relay network, and reviewed blind — judged purely on code quality.

```bash
# Install
curl -fsSL https://voidpush.dev/install.sh | sh

# Become anonymous
void init
# ✓ Identity: void_7f3a2b9c (expires in 72h)

# Push anonymously
void push origin main
# ✓ Pushed anonymously — quality score pending

# Check your score
void score
# Score: 9.4 / 10 · Rank: #3 this week
```

---

## How it works

```
You → [strip metadata] → [encrypt onion] → Relay 1 → Relay 2 → Relay 3 → git remote
                                                                              ↓
                                                                       Blind reviewers
                                                                              ↓
                                                                       Quality score
```

1. **`void init`** — Ed25519 keypair generated locally. Nothing leaves your machine.
2. **`void push`** — Strips author/email/timestamp from commits. Encrypts with X25519 + ChaCha20-Poly1305 per relay hop. Routes through 3+ relay nodes across different jurisdictions.
3. **Blind review** — Reviewers see only the diff. No name, no avatar, no profile.
4. **Score** — Weighted quality score (correctness 40%, readability 35%, style 25%). Reputation links across sessions via ZK proof.

---

## Monorepo structure

```
voidpush/
├── apps/
│   ├── web/                       # Next.js — all public pages
│   ├── cli/                       # vpush CLI — Rust binary
│   ├── relay/                     # Relay node — Rust/Axum, onion routing
│   ├── score-engine/              # Blind review API — Python/FastAPI
│   ├── vscode-extension/          # VS Code extension
│   └── mcp-server/                # MCP server — AI agent integration
├── packages/
│   ├── @voidpush/types/           # Shared TypeScript types
│   ├── @voidpush/ui/              # Shared React components
│   ├── @voidpush/crypto/          # Shared crypto utilities (TS)
│   ├── @voidpush/sdk/             # TypeScript SDK (npm install @voidpush/sdk)
│   ├── void-crypto/               # Shared crypto primitives (Rust)
│   └── voidpush-sdk-py/           # Python SDK (pip install voidpush)
├── infra/
│   ├── docker/                    # Dockerfiles + docker-compose
│   ├── k8s/                       # Kubernetes manifests (HPA, relay, score-engine)
│   └── terraform/                 # 9 relay nodes across 9 countries
├── docs/
│   ├── protocol-spec.md           # Full protocol specification
│   ├── federation-spec.md         # Community relay node standard
│   └── security-audit.md          # Threat model + audit checklist
├── .github/
│   ├── workflows/ci.yml           # CI — Rust + Python + TS + Docker + release
│   ├── SECURITY.md                # Security disclosure policy
│   └── pull_request_template.md  # PR template
├── CONTRIBUTING.md
├── LICENSE
├── Cargo.toml                     # Rust workspace (v1.0.0)
├── package.json                   # pnpm workspace
└── pnpm-workspace.yaml
```

---

## CLI commands

| Command | Description |
|---|---|
| `void init` | Generate ephemeral Ed25519 identity (72h TTL) |
| `void push <remote> <branch>` | Push anonymously through relay chain |
| `void clone <void://url>` | Clone a repo anonymously |
| `void pr --title "..."` | Open anonymous pull request |
| `void score` | Fetch quality score for last push |
| `void relay ls` | List relay nodes with latency + trust |
| `void expire` | Destroy current identity (3-pass wipe) |
| `void invite` | Generate one-time invite links |
| `void verify` | Generate ZK proof of past contributions |
| `void org` | Org anonymity pool management |

---

## Web pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/docs` | CLI reference + protocol explainer |
| `/network` | Live relay network explorer |
| `/leaderboard` | Anonymous contributor rankings |
| `/explore` | Browse void:// repos |
| `/showcase` | Top-scored anonymous PRs |
| `/blog` | Protocol updates + anonymity essays |
| `/waitlist` | Beta access + invite system |
| `/dashboard` | Identity status + score history + relay health |
| `/org` | Team org mode + pricing |
| `/press` | Brand assets + press kit |

---

## SDKs

**TypeScript:**
```bash
npm install @voidpush/sdk
```
```ts
import { VoidPushClient } from "@voidpush/sdk";
const client = new VoidPushClient();
const score = await client.getScore("void_7f3a2b9c");
```

**Python:**
```bash
pip install voidpush
```
```python
from voidpush import VoidPushClient
async with VoidPushClient() as client:
    score = await client.get_score("void_7f3a2b9c")
```

---

## MCP Server (AI agent integration)

```json
{
  "mcpServers": {
    "voidpush": {
      "command": "npx",
      "args": ["@voidpush/mcp-server"]
    }
  }
}
```

Claude and other AI agents can then:
- `vpush_init` — generate an anonymous identity
- `vpush_push` — push code anonymously
- `vpush_score` — check quality scores
- `vpush_leaderboard` — query the anonymous leaderboard

---

## Prerequisites

| Tool | Version | Used for |
|---|---|---|
| Node.js | ≥ 20 | Web, MCP server, SDKs |
| pnpm | ≥ 9 | JS package manager |
| Rust | ≥ 1.78 | CLI, relay node, void-crypto |
| Python | ≥ 3.12 | Score engine |
| Hatch | ≥ 1.12 | Python env manager |
| Docker | any | Local full-stack dev |
| git | ≥ 2.30 | Required by vpush CLI |

---

## Getting started

```bash
git clone https://github.com/voidpush-stack/voidpush
cd voidpush

# JS deps
pnpm install

# Run web app → localhost:3000
pnpm web

# Build CLI
cargo build -p vpush

# Run score engine → localhost:8001
cd apps/score-engine && hatch run dev

# Full stack
cd infra/docker
RELAY_PRIVATE_KEY=$(openssl rand -hex 32) docker compose up
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Web | Next.js 14, React 18, TypeScript, Tailwind |
| CLI | Rust, Clap 4, git2 |
| Relay node | Rust, Axum, Tokio |
| Score engine | Python 3.12, FastAPI, PostgreSQL, Redis |
| TypeScript SDK | `@voidpush/sdk` — browser + Node compatible |
| Python SDK | `voidpush` — async/await, httpx |
| MCP server | `@voidpush/mcp-server` — Claude/Codex integration |
| Crypto | Ed25519, X25519, ChaCha20-Poly1305 |
| ZK reputation | Schnorr-style proof linking |
| Monorepo | pnpm workspaces + Turborepo |
| CI/CD | GitHub Actions + Docker + release binaries |
| Infra | Kubernetes + Terraform (9 countries) |

---

## Roadmap

- [x] Phase 1 — Foundation
- [x] Phase 2 — Core product (relay, score engine, ZK, rate limiting)
- [x] Phase 3 — Community (blog, showcase, explorer, VS Code ext, federation)
- [x] Phase 4 — Scale (SDK, MCP server, org mode, K8s, Terraform, v1.0)

---

## Documentation

- [Protocol Specification](docs/protocol-spec.md)
- [Federation Specification](docs/federation-spec.md)
- [Security Audit](docs/security-audit.md)
- [Contributing](CONTRIBUTING.md)

---

## License

MIT — see [LICENSE](LICENSE)

---

*👻 push to the void · https://voidpush.dev*
