# Verification

## Automated local commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run export:all
npm.cmd run test:web
npx.cmd expo install --check
npx.cmd expo-doctor
npx.cmd expo export --platform android --platform ios --platform web
npx.cmd --yes deno check supabase/functions/ai-coach/index.ts supabase/functions/delete-account/index.ts
```

Vitest tests cover haversine/date-line distance, invalid/poor/stale fixes, sport speed limits, jitter rejection, pause/resume timing, disconnected segments and long gaps, split interpolation, pace, reliable altitude, valid escaped GPX, entitlement expiry/fail-closed behavior, empty analytics, disk-backed SQLite persistence/reopen/delete, write ordering/error recovery, account-pinned uploads, failed upload retries, edits during upload, owner restore, and bounded/malformed server request parsing. Sync tests use mocked network responses. The SQLite contract tests substitute Node’s actual SQLite driver for the Expo native bridge; they do not prove Expo bridge behavior on a phone. Node may print an experimental SQLite warning.

Browser smoke tests use locally installed Microsoft Edge via Playwright, serve the exported `dist/` on localhost only, and test navigation, honest empty/service states, disabled web recording, theme control, and phone/tablet widths. Run with no backend keys in the exported bundle. `test:web` manages and stops its local server. These tests passed; screenshots are local ignored artifacts under `test-results/`.

React Native Testing Library is installed; native component interaction tests have not yet been authored. Browser smoke tests and device end-to-end tests are distinct from pure function coverage. Do not call a feature physically tested based only on typechecking or exports.

## Database security tests

With Docker Desktop and a disposable local Supabase instance: `npx.cmd supabase start`, `npx.cmd supabase db reset`, `npx.cmd supabase test db`. The migration and pgTAP tests are not verified until these pass. Fixtures cover public/private/follower boundaries, raw GPS ownership, blocks, subscription write denial, hidden-activity comments, private zones and server-only quota RPC. Add concurrent upload ownership/replay tests, all table policies, storage isolation, account deletion cascades and service-role abuse tests before release.

## Required phone checks (Android and iOS)

1. Install a development build. Deny location, grant approximate location, disable GPS, then grant precise location; verify clear recovery paths.
2. Record a known outdoor route per sport; compare measured distance, pace and splits with a trusted reference. Test poor signal, tunnels and device-clock changes.
3. Pause while moving, resume elsewhere; ensure no connecting distance, line or time is counted. Finish, edit, export GPX and reopen after app restart.
4. Interrupt the process and recover the draft. Verify every checkpoint saved before interruption and no invented active time.
5. Foreground-only: background/lock screen should pause. Native background enabled: check permissions, Android notification, iOS indicator, lock-screen movement and restored UI. Force-stop/kill behavior is OS-dependent, never guaranteed.
6. Test battery saver/OEM restrictions, phone reboot, revoking permissions mid-workout, missing fixes, SQLite failure/full storage and multi-hour recordings.
7. Verify all four sports, units, light/dark, larger system text, screen reader labels, tablet width and touch targets.
8. Sign in with two accounts; verify no cross-account upload, raw track leak, premium escalation or unauthorized activity edits. Exercise verify/reset links on the requesting device.
9. Test network drop during upload/restore and retry, switching accounts during requests, deletion during sync, and edits on two devices. Upload is transactional/idempotent; missing-workout restore and opt-in active-app retries exist. Full multi-device edit conflict resolution and OS background upload are not implemented.
10. Test store sandbox monthly/annual/restore/expiry/refund; test AI missing/expired credentials, denied consent, missing premium, quota, provider errors and response limits.

Use real user-approved test accounts and phone recordings. Never seed fabricated athlete data in production.
