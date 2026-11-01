# StravaKinda

An original, dark-first Android/iOS fitness journal built with Expo SDK 58, React Native, TypeScript, and Expo Router. Initialized directly in this workspace.

**Development implementation, not a production release.** GPS algorithms and persistence have automated coverage; real location recording, permissions, maps, purchases, and background behavior require physical-device testing. No sample athletes, fabricated workouts, API credentials, paid resources, deployments, or pushes were created.

## Run on Windows

Node 24 LTS and npm are installed in the current environment. Use `npm.cmd` and `npx.cmd` because Windows PowerShell blocks the `.ps1` launchers.

```powershell
cd 'C:\AI project\StravaKinda'
npm.cmd ci
npm.cmd run check
npm.cmd run web
```

Web is a layout preview: recording and native maps are deliberately unavailable, and preview preferences are in memory. Android/iOS use SQLite for local workouts. To connect services:

```powershell
Copy-Item .env.example .env
# Edit .env with your own public service configuration.
npx.cmd expo start --dev-client
```

Install a development build on your phone first; native RevenueCat and background location are not supported as a complete flow in Expo Go. See [setup](docs/SETUP.md) and [build instructions](docs/DEPLOYMENT.md). No Mac is needed for the initial Android workflow; iOS cloud builds require Apple signing and an appropriate Apple account.

## Implemented paths

- Five tabs: Home, Explore, Record, Activities, Profile; dark/light appearance and km/mi settings.
- Local recorder for walking/running/cycling/hiking: pause/resume/finish/discard, timestamped fixes, quality filters, gap-safe geometry, splits, elevation filtering, interruption recovery.
- Activity history/filter/detail/replay/edit/delete and full-route GPX export.
- Weekly/monthly/yearly summaries, eight-week chart, goal tracking and longest outing.
- Basic waypoint route builder with local geometry storage, no routing-provider impersonation.
- Supabase account, profile privacy, owner cloud upload/restore, opt-in foreground sync retries, social adapters, schema/RLS and account-deletion function.
- RevenueCat offerings/purchase/restore adapter; server-verified premium AI coach with consent and daily usage reservation.

Implementation does not imply end-to-end verification. [PROGRESS.md](docs/PROGRESS.md) is the feature-by-feature source of truth. Large features still need work, particularly multi-device conflict resolution, OS background sync, segments/rankings, moderation, advanced premium tools, offline base maps, avatar UI and wearables.

## Project guide

[Architecture](docs/ARCHITECTURE.md) · [Features](docs/FEATURES.md) · [Setup](docs/SETUP.md) · [Testing](docs/TESTING.md) · [Deployment](docs/DEPLOYMENT.md) · [Progress](docs/PROGRESS.md) · [Security](docs/SECURITY.md)
