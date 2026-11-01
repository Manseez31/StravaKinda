# Windows setup

## Local preview

1. Install/use Node 24 LTS. Current workspace was initialized using Node 24.14.1 and npm 11.11.0.
2. Run `npm.cmd ci` and `npm.cmd run check` in the project root.
3. Run `npm.cmd run web` for a browser layout preview. This does not exercise SQLite, maps, GPS, sharing, or store purchases.
4. Copy `.env.example` to `.env` and fill only the services you intend to connect. Restart Metro after changes.

No Java/Android SDK is required for browser preview or EAS cloud builds. The detected local Java shim is not an assurance of a compatible Android toolchain. Android Studio/ADB are needed for local emulator/native builds; no ADB was found during setup.

## Supabase (user-managed external setup)

Create or select a **test** Supabase project yourself. No external project was created by this session. Keep service-role keys out of `.env` and all mobile code. Add the project URL and public anon/publishable key using the variable names in `.env.example`.

Before applying a migration to a hosted database, review it and approve that external change. For a disposable local stack with Docker Desktop running:

```powershell
npx.cmd supabase start
npx.cmd supabase db reset
npx.cmd supabase test db
```

`db reset` deletes the local test database. Do not use it against important data. This session did not execute the migration: the Docker daemon was unavailable.

For a hosted test project, link with `npx.cmd supabase link --project-ref YOUR_REF`, review migration changes and apply with `npx.cmd supabase db push` only when authorized. Existing auth users require a profile/settings backfill; the migration trigger handles new signups.

Configure Auth email confirmation, secure password requirements, SMTP for reliable email, rate limits, and redirect allowlist `stravakinda://auth/callback`. Verification and password-reset PKCE links must open on the requesting device. Test sign-up, verification, reset, token refresh, expired links, logout and account deletion. Social OAuth is not implemented; add providers plus native redirect handling later.

The migration creates a private `avatars` Storage bucket with owner-path policies. Avatar selection/upload UI is not implemented. All uploaded files must live under `USER_UUID/filename`; nested directories are not supported by the current delete function.

## Maps

iOS uses the native default Apple map renderer. Android native maps need a Google Maps SDK API key, configured as `EXPO_PUBLIC_GOOGLE_MAPS_KEY` **before building**. Restrict it to the Android package and signing certificate. Public mobile keys are not secrets; restrictions are essential. When no Android key is supplied, the map component shows a configuration state while GPS recording stays available.

Enabling Google Maps may require a billing account and can incur usage costs. This session did not enable billing. Review the provider’s current [Maps SDK requirements](https://developers.google.com/maps/documentation/android-sdk/get-api-key) and terms before using it. Basemap attribution stays with the native SDK. No search, elevation, road-routing or tile-download provider is configured, and no such API calls are fabricated. Waypoint routes are straight-line geometry stored offline, not offline base maps or navigation directions.

## RevenueCat and stores

Create Apple/Google store apps and sandbox products yourself. Associate monthly/annual products with a RevenueCat offering and entitlement identifier **premium**. The adapter uses store-returned titles and prices. Set separate platform public SDK keys in `.env`. Use the authenticated Supabase UUID as RevenueCat app user ID. Install a native development build and test purchase, renewal, cancellation, billing issues, expiry and restore using store sandbox accounts. Do not configure public sale while premium features remain incomplete.

The server uses a private RevenueCat API key (`REVENUECAT_SECRET_KEY`) to check current entitlement; no client-controlled premium flag is accepted. A webhook handler and subscription-table reconciliation are not yet implemented.

## AI Coach / Edge Functions

No OpenAI request was made. With your approval for deploying external code and potential usage charges, configure server secrets using the Supabase dashboard or CLI, never `EXPO_PUBLIC_` names:

```powershell
npx.cmd supabase secrets set OPENAI_API_KEY=YOUR_SERVER_KEY
npx.cmd supabase secrets set OPENAI_MODEL=YOUR_CHOSEN_SUPPORTED_MODEL
npx.cmd supabase secrets set REVENUECAT_SECRET_KEY=YOUR_PRIVATE_RC_KEY
npx.cmd supabase functions deploy ai-coach
npx.cmd supabase functions deploy delete-account
```

Avoid secrets in shell history: prefer the dashboard or a protected secrets file. Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to hosted functions. JWT verification is performed explicitly with `auth.getUser()` in both handlers, including when gateway verification is disabled. Missing keys, entitlement lookup failures and quota failures deny service. Configure provider spending limits and monitor usage before enabling real users.

Official references: [Expo 58 Location](https://docs.expo.dev/versions/v58.0.0/sdk/location/), [SQLite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [RevenueCat quickstart](https://www.revenuecat.com/docs/getting-started/quickstart), [OpenAI text generation](https://developers.openai.com/api/docs/guides/text).
