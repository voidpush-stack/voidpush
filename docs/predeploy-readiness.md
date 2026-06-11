# VoidPush Pre-Deploy Readiness

Use this checklist before exposing VoidPush frontend, relay, or score-engine services to the public internet.

## Current Deployment Posture

- Frontend can be deployed to a staging or preview environment first.
- Relay and score-engine should stay local/private until secrets, health checks, and access boundaries are verified.
- Docker image publication is manual-only through the CI workflow dispatch input `publish_images`.

## Security

- No real `.env` files are committed.
- Use `.env.example` only as a template.
- Store `RELAY_PRIVATE_KEY`, database credentials, and provider tokens in a secret manager.
- Generate `RELAY_PRIVATE_KEY` with `openssl rand -hex 32`.
- Never copy `.vpush`, `identity.toml`, `zk-root`, relay private key files, logs, or local database files into the repo.
- Run `node tools/secret-scan.mjs` before every deployment branch merge.

## Frontend Staging Gate

- `pnpm --filter @voidpush/web typecheck` passes.
- `pnpm --filter @voidpush/web build` passes.
- Navigation links, GitHub link, X link, docs link, theme toggle, and dashboard buttons work.
- Desktop and mobile layouts have no text overflow or broken 3D scenes.
- `RELAY_API_URL` and `SCORE_ENGINE_URL` point to private/internal staging services when backend is enabled.

## Relay Staging Gate

- `RELAY_PRIVATE_KEY` is set from a secret manager, not a file in the repo.
- `NODE_TYPE`, `RELAY_ID`, `RELAY_REGION`, `REGISTRY_URL`, and `MAX_PAYLOAD_BYTES` are explicit.
- Only required ports are exposed.
- Local relay E2E passes with `node tools/e2e-relay-push.mjs`.
- Logs do not include private keys, author identity, or raw secret payloads.

## Score Engine Staging Gate

- `DATABASE_URL`, `REDIS_URL`, `ENV`, `AUDIT_LOG_PATH`, and `CORS_ORIGINS` are explicit.
- `ENV=production` disables OpenAPI docs.
- `CORS_ORIGINS` includes only the real frontend domains for staging/production.
- `/health` responds before the service is attached to public traffic.
- Database migrations are reviewed before production data is connected.

## Rollback

- Frontend rollback: redeploy the previous successful build.
- Backend rollback: keep the previous container image tag available.
- Database rollback: snapshot before migrations and keep migration rollback notes with the release.
