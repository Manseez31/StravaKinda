# Security review and release blockers

- No service-role, OpenAI, RevenueCat secret, signing key or user credential is present in the repository. `.env` and local variants are ignored; `.env.example` holds blanks only.
- Auth sessions use native SecureStore chunks; browser preview uses memory. Local SQLite tracks are plaintext within app storage and remain after logout. Device access is the local privacy boundary.
- Every application table has RLS enabled in the migration. Raw GPS never has public/follower read policies. Client writes to premium/metrics/AI usage/segment efforts are denied. `security definer` helpers use an empty search path and explicit grants.
- Edge Functions authenticate via server-side `getUser`. AI independently verifies RevenueCat and reserves quota atomically. Requests send summaries only; questions may still contain personal data users type, so the UI discourages identifying details.
- Activity summaries remain unverified. No competitive leaderboard consumes client claims. Upload applies basic speed and timestamp checks but cannot certify that a GPS route is genuine.
- Social abuse controls are incomplete. Block/report primitives and atomic database limits for comments (20/min), kudos (60/min), follows (30/min) and reports (5/day) exist. Rate-counter retention cleanup, operational moderation, private follow requests, admin UI, notification delivery and audit trails are not ready for public traffic. Rate-limit migration is not executed/verified yet.
- Account deletion removes flat owner avatar files before auth deletion; relational data cascades. More than 1000 stored avatar files/nested directories require an extended storage cleanup worker. Store subscriptions require separate cancellation.

## Dependency audit recorded 2026-10-25

Initial `npm audit` reported 5 high-severity findings propagated through Expo CLI: `node-forge` <=1.4.0 and a nested Zod 3.x dependency. The app's direct Zod 4.6.7 is outside the reported Zod affected range. The audit suggested a breaking Expo downgrade; this was not applied because it would invalidate SDK 58 compatibility. Forcing nested Zod 4 into CLI code written for Zod 3 is also unsafe without upstream support.

The node-forge advisory currently lists no patched version. Review upstream fixes and rerun audit before any signed release. No package manager `--force` security downgrade was applied. These are release blockers requiring evaluation, even though the observed dependency paths are tooling-related.

References: [node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
