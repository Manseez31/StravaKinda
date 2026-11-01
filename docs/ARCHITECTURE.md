# Architecture

## Boundaries

`src/app/` contains Expo Router screens and five-tab navigation (the generated AGENTS.md requires this convention). Business code lives outside the route tree:

| Location | Responsibility |
| --- | --- |
| components/ | Theme-aware UI primitives, maps, activity summary cards |
| features/analytics/ | Descriptive training calculations |
| hooks/ | Session observation and consistent async UI errors/loading |
| types/ | Workout, coordinates, preferences and privacy contracts |
| utils/ | Pure GPS filters, distance, splits, GPX, formatting, entitlement guards |
| services/database.ts | SQLite WAL, parameterized persistence and write serialization |
| services/recorder.ts | Location permissions, foreground watcher, optional native background task, lifecycle recovery |
| services/supabase.ts | PKCE auth client with SecureStore session chunks |
| services/sync.ts | Account-owned upload, missing-workout restore and opt-in retries |
| services/purchases.ts | RevenueCat SDK boundary; no simulated entitlement |
| store/ | Zustand snapshots refreshed after durable writes |
| supabase/ | PostgreSQL/PostGIS migration, RLS tests, Deno Edge Functions |
| tests/ | Vitest pure-logic and SQLite contract tests |

TanStack Query manages remote feed/community reads. React Hook Form and Zod validate auth forms. Secrets are never bundled: only public client configuration uses `EXPO_PUBLIC_` variables.

## Recording flow

Permission → create workout → durably save → attach foreground watcher → validate fixes → serialize read/modify/write → refresh UI. Storage errors are displayed. Every accepted fix is checkpointed. No distance is awarded across manual/automatic pauses or GPS gaps over 60 seconds. Unsupported or poor altitude is ignored rather than invented.

Manual pause freezes active time; elapsed time includes breaks. Moving time sums accepted intervals above 0.5 m/s. Average pace is moving time per distance. Kilometer splits interpolate the crossing time between accepted fixes. These choices require outdoor calibration and are not a claim of sports-laboratory accuracy.

Leaving the app without enabled native background updates pauses the session. Recovery without background evidence freezes active time at the last accepted point and offers Resume. Android/iOS may terminate tasks; force-kill continuation is never guaranteed. Auto-pause is experimental: speed confidence and a stationary window gate it, and explicit manual pause takes precedence.

SQLite currently stores complete JSON workout snapshots. This provides simple atomic checkpoints but reserializes the route and reloads workout history per update. Before long-duration production use, migrate to append-only local point rows, incremental aggregates, bounded map sampling, and paginated history. Benchmark multi-hour tracks and disk-full behavior. SQLite data is not encrypted; device-level protection is the current boundary. Auth tokens use platform SecureStore instead.

## Cloud privacy

Activities contain summary fields only; coordinates are stored in separate `activity_points`. RLS allows raw point reads only to the owner, even for public/follower activities. Public feeds select summaries explicitly. There is no public raw-track or ranking endpoint. Privacy zones are owner-only; shared-route redaction is not yet enabled. GPX exports intentionally contain full owner tracks and warn before sharing.

`save_workout` checks identity, ownership, timestamp order, coordinate constraints, track size and sport-specific impossible-speed thresholds. Writes are transactional and retryable. Metrics remain `verified=false`: client summaries and basic GPS checks are not sufficient to establish fair leaderboard ranking. Segment effort writes are server-only until a vetted matcher is available.

Local workouts are device-owned. Recording while signed in links them to that user; anonymous workouts require explicit linking in Detail before upload. Switching accounts does not reassign workouts: each sync job pins the original JWT. Local journal data remains on this device after logout; users sharing a device should export/delete it as needed. Sync restores missing owner workouts with paginated private point reads. It retains edits made during an upload and skips deletion tombstones. Existing local copies are not overwritten by cloud edits; multi-device conflict resolution still needs a revision protocol. The first explicit sync enables retries once per minute while the app is active; Settings disables them. OS background upload remains a work item.

## Premium and coach

SDK customer info drives purchase/restore responses. Client guards are for display only. Premium backend requests independently query RevenueCat using the authenticated Supabase UUID, then reserve a request atomically (10/day). Expired, absent, unavailable, or unconfigured entitlements fail closed. The subscriptions table is client-read-only and reserved for future verified webhook reconciliation; it is not currently used as entitlement truth.

The coach sends up to 50 summary rows from the last 30 days and a bounded question to the Responses API, with no coordinates or identity fields. Response storage is disabled in the request. Conversations currently live in UI memory, and each question is independent rather than a persisted multi-turn history. Usage is reserved before the provider call, so failures can still count toward the daily cap. Add project-wide budget monitoring and production abuse controls before launch.
