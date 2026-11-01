# Build and release readiness

No build was submitted, cloud resource created, application deployed, repository pushed, or store charge incurred during implementation. EAS commands below are instructions for user-authorized future work.

## Development build from Windows

Choose final bundle/package identifiers before publishing; current placeholder is `com.stravakinda.app`. Configure `.env` and restricted map keys before native build. Use an Expo account and check available build quotas/pricing before starting cloud builds:

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build:configure
npx.cmd eas-cli@latest build --platform android --profile development
```

Install the returned APK on a physical Android phone, then run:

```powershell
npx.cmd expo start --dev-client
```

Cloud build commands can incur charges and require explicit approval before this agent runs them. `eas.json` also defines preview APK and production auto-increment profiles. Keep release keystores and store credentials outside source control.

For iOS, run `npx.cmd eas-cli@latest build --platform ios --profile development` after Apple developer signing/device registration is configured. Windows can initiate EAS builds; local iOS native builds and simulators require macOS. No Apple agreements/signing can be completed autonomously.

## Release gates

- Complete physical-device GPS, lock-screen/background, battery saver, crash recovery and multi-hour recording tests.
- Execute migrations and multi-user RLS tests on disposable Supabase; independently review grants, policies, transactional uploads and storage deletion.
- Configure store sandbox products, RevenueCat, verified entitlements, expiry/restore and cancellation paths. Keep paid sale disabled until premium features are ready.
- Test AI quota/consent/auth and provider outages; enable project-wide spend caps and operational alerts.
- Replace scaffold icon/splash assets with final original branding. Current images are Expo template placeholders, not finished product artwork.
- Finalize legal privacy/terms, support contact, data retention/export, user-report handling and account deletion. Draft placeholders are not legal approval.
- Complete App Store privacy labels, Play Data Safety and background-location justification/review. Explain use of precise location and background access in the store listing.
- Finish accessibility, screenshots, tablet/layout, offline error paths, dependency security, crash reporting and performance audits.

Native configuration resides in `app.config.ts` and plugins. Do not hand-edit generated `android/` or `ios/` directories. `npx.cmd expo export --platform android --platform ios --platform web` checks JS bundling, not signing or native compilation.
