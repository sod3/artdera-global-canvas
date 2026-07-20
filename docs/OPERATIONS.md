# Operations, deployment, and secret rotation

## Deployment shape

Build the frontend with `npm run build` and the API with `npm run build:api`. Run the compiled API as a persistent Node process because local uploads and reservation/promotion maintenance use the API process. For horizontally scaled production, move uploads to object storage and run maintenance as a single scheduled job or distributed-lock worker.

Set `APP_URL` to the exact HTTPS frontend origin. If frontend and API are split, set `VITE_API_URL` at frontend build time and configure the reverse proxy to preserve HTTPS/proxy headers. Do not use wildcard credentialed CORS.

MongoDB must support transactions. Atlas should use TLS, a database-specific user with least privilege, an IP/private-network allowlist, continuous backup, point-in-time recovery where available, and alerts for connection/operation anomalies.

## Secret rotation

1. Create a replacement credential at the provider; do not overwrite the only working credential first.
2. Update the deployment secret store, never Git or a Vite-prefixed variable.
3. restart/roll the API and verify `/api/health`, login, and `npm run db:smoke` where safe.
4. Revoke the old credential after the replacement is healthy.
5. For `AUTH_SECRET`, rotation invalidates any secret-derived material; schedule it as a session logout event and verify password reset/OTP delivery.
6. Review Git history and provider logs if a secret was exposed. Rotation, not merely deleting a file, is required.

The MongoDB URI, auth secret, provider API keys, webhook secrets, SMTP credentials, and object-storage credentials belong only in the deployment secret manager. `.env.example` contains placeholders only; `.env*` secret variants are ignored.

## Backups and recovery

- Enable Atlas continuous backups or daily snapshots with retention appropriate to marketplace, invoice, and audit requirements.
- Test restoration into a separate restricted project at least quarterly.
- Keep object-storage versioning/lifecycle policies aligned with database retention.
- Document recovery time and recovery point objectives before accepting production orders.
- Never use demo seed/reset commands against production.

## External providers still required for launch

- Payment intent confirmation/webhooks, refunds, and reconciliation.
- Transactional email/OTP delivery.
- Private/public object storage with malware scanning and signed private downloads.
- Courier booking/tracking webhooks.
- Tokenized bank payout/disbursement and reconciliation.
- Legal review of policies, retention, returns, tax, and dispute language.

`DEMO_PAYMENT_MODE`, `DEMO_OTP_MODE`, console email, local uploads, and demo fixture accounts are development facilities and must be disabled or replaced before production.
