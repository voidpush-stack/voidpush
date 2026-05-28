# Contributing to VoidPush

👻 All contributions to VoidPush are made anonymously via void-cli. This is both a policy and a proof-of-concept.

---

## Quick start

```bash
# Install void-cli
curl -fsSL https://voidpush.dev/install.sh | sh

# Generate identity
void init

# Clone the repo
void clone void://voidpush/voidpush

# Make your changes, then push anonymously
void push origin main

# Or open a PR
void pr --title "your change" --into main
```

---

## Development setup

### Prerequisites

| Tool | Version | Used for |
|---|---|---|
| Node.js | ≥ 20 | Web app |
| pnpm | ≥ 9 | Package manager |
| Rust | ≥ 1.78 | CLI + relay |
| Python | ≥ 3.12 | Score engine |
| Docker | any | Local infra |

### Setup

```bash
# Clone
git clone https://github.com/voidpush/voidpush
cd voidpush

# JS dependencies
pnpm install

# Run web app
pnpm web               # → localhost:3000

# Build CLI
cargo build -p vpush

# Run score engine
cd apps/score-engine
hatch run dev          # → localhost:8001

# Run relay node (needs RELAY_PRIVATE_KEY env var)
cargo run -p void-relay

# Run everything with Docker
cd infra/docker
docker compose up
```

---

## Code style

### Rust
- `cargo fmt` before every commit
- `cargo clippy -- -D warnings` must pass
- Tests in `#[cfg(test)]` modules

### Python
- `ruff format .` for formatting
- `ruff check .` for linting
- `mypy voidpush_score_engine/` for type checking
- `pytest` for tests

### TypeScript
- Prettier (via `pnpm lint`)
- No `any` without comment explaining why
- All React components must have `"use client"` if they use browser APIs

---

## Testing

```bash
# Rust
cargo test

# Python
cd apps/score-engine && hatch run test

# Web app
cd apps/web && pnpm typecheck
```

---

## Pull request process

1. Fork and make changes on a branch
2. Run all tests locally (or via `void push --dry-run`)
3. Submit via `void pr --title "..." --into main`
4. Wait for blind review (24–72h)
5. Address feedback without revealing your identity — your ghost ID is your handle

---

## Code of conduct

1. **Code only.** Review the diff, not the person (because there is no person visible).
2. **Be specific.** Vague feedback helps no one. "Refactor this" is not a review.
3. **No dismissiveness.** A low score with no feedback is a protocol violation.
4. **No reverse-engineering identities.** If you figure out who wrote something, keep it to yourself. You've broken the spirit of the protocol.

---

## Security issues

Do not open public issues for security vulnerabilities. Email security@voidpush.dev. See `docs/security-audit.md` for our response process.

---

*VoidPush is built anonymously. Your contributions are judged on their merit alone.*
