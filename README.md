# 👻 VoidPush

> Anonymous code contribution network. No usernames. No history. No bias. Just pure signal.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0--alpha-a78bfa)](https://voidpush.dev)
[![CI](https://img.shields.io/github/actions/workflow/status/voidpush/voidpush/ci.yml?label=CI)](https://github.com/voidpush/voidpush/actions)

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

# Check your score (after 24h blind review window)
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

1. **`void init`** — Generates an Ed25519 keypair locally. Nothing leaves your machine.
2. **`void push`** — Strips author/email/timestamp from commits, encrypts with X25519 + ChaCha20-Poly1305 per relay hop, routes through 3+ relay nodes across different jurisdictions.
3. **Blind review** — Reviewers see only the diff. No name, no avatar, no GitHub profile.
4. **Score** — Weighted quality score (correctness 40%, readability 35%, style 25%). Reputation links across sessions via ZK proof without revealing identity.

---

## Monorepo structure

```
voidpush/
├── apps/
│   ├── web/                  # Next.js — landing page, docs, explorer, leaderboard, blog
│   ├── cli/                  # vpush — Rust binary (void init/push/pr/score/...)
│   ├── relay/                # Relay node server — Rust/Axum, onion routing
│   ├── score-engine/         # Blind review aggregation — Python/FastAPI/PostgreSQL
│   └── vscode-extension/     # VS Code extension — void push from the editor
├── packages/
│   ├── @voidpush/types/      # Shared TypeScript types
│   ├── @voidpush/ui/         # Shared React components
│   ├── @voidpush/crypto/     # Shared crypto utilities (TypeScript)
│   └── void-crypto/          # Shared crypto primitives (Rust)
├── infra/
│   ├── docker/               # Dockerfiles + docker-compose for local dev
│   ├── k8s/                  # Kubernetes manifests
│   └── terraform/            # Relay node provisioning (9 countries)
├── docs/
│   ├── protocol-spec.md      # Full protocol specification
│   ├── federation-spec.md    # Community relay node standard
│   ├── security-audit.md     # Threat model + audit checklist
│   └── cli-reference.md      # CLI command reference
├── .github/workflows/ci.yml  # CI — Rust + Python + TypeScript + release builds
├── CONTRIBUTING.md           # How to contribute anonymously via vpush CLI
├── Cargo.toml                # Rust workspace
├── package.json              # pnpm workspace
└── pnpm-workspace.yaml       # pnpm workspace config
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

---

## Prerequisites

| Tool | Version | Used for |
|---|---|---|
| Node.js | ≥ 20 | Web app, packages |
| pnpm | ≥ 9 | JS package manager |
| Rust | ≥ 1.78 | CLI + relay node |
| Python | ≥ 3.12 | Score engine |
| Hatch | ≥ 1.12 | Python env manager |
| Docker | any | Local full-stack dev |
| git | ≥ 2.30 | Required by vpush CLI |

---

## Getting started (development)

```bash
# 1. Clone
git clone https://github.com/voidpush/voidpush
cd voidpush

# 2. Install JS deps
pnpm install

# 3. Run web app
pnpm web                    # → http://localhost:3000

# 4. Build CLI
cargo build -p vpush        # binary at target/debug/vpush

# 5. Run score engine
cd apps/score-engine
hatch run dev               # → http://localhost:8001

# 6. Full stack with Docker
cd infra/docker
RELAY_PRIVATE_KEY=$(openssl rand -hex 32) docker compose up
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Web | Next.js 14, React 18, TypeScript, Tailwind CSS |
| CLI | Rust, Clap 4, git2 (libgit2 bindings) |
| Relay node | Rust, Axum, Tokio, Tower |
| Score engine | Python 3.12, FastAPI, SQLAlchemy (async), PostgreSQL, Redis |
| Crypto | Ed25519, X25519, ChaCha20-Poly1305 (onion encryption) |
| ZK reputation | Schnorr-style proof linking (Bulletproofs upgrade planned) |
| Monorepo | pnpm workspaces + Turborepo |
| CI/CD | GitHub Actions (Rust + Python + TypeScript + binary releases) |
| Infra | Docker, Kubernetes, Terraform |
| VS Code | Extension with status bar, score webview, SCM integration |

---

## Web pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/docs` | CLI reference + protocol explainer |
| `/network` | Live relay network explorer |
| `/leaderboard` | Anonymous rankings |
| `/explore` | Browse void:// repos |
| `/showcase` | Top-scored anonymous PRs |
| `/blog` | Protocol updates + anonymity essays |
| `/waitlist` | Beta access + invite system |
| `/press` | Brand assets + press kit |

---

## Documentation

- [Protocol Specification](docs/protocol-spec.md)
- [Federation Specification](docs/federation-spec.md)
- [Security Audit](docs/security-audit.md)
- [Contributing](CONTRIBUTING.md)

---

## Roadmap

- [x] Phase 1 — Foundation
- [x] Phase 2 — Core product
- [x] Phase 3 — Community
- [ ] Phase 4 — Scale (SDK, MCP server, org mode, K8s, v1.0)

---

## License

MIT — see [LICENSE](LICENSE)

---

*👻 push to the void · https://voidpush.dev*
