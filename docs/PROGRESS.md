# Implementation progress

Updated 2026-10-25 (Asia/Katmandu). This is an initial implementation, not completion of the entire product brief. Never infer real-device or service verification from source presence.

Status vocabulary: **Complete and tested**; **Implemented but unverified**; **Partially implemented**; **Blocked by service credentials/device/store setup**; **Not started**.

| Feature | Status | Evidence / remaining work |
| --- | --- | --- |
| Expo 58 / TypeScript / Router / five tabs | Implemented but unverified | Typecheck and three-platform bundling pass; native runtime pending |
| Dark/light themes, units, touch targets, empty/loading/errors | Implemented but unverified | Browser theme/empty states tested; shared skeleton blocks; native/accessibility audit pending |
| GPS geometry, filters, timing, splits, GPX logic | Complete and tested | Vitest known distances, jumps, jitter, pauses, gaps, altitude and XML tests |
| Local SQLite schema/write queue/persistence | Complete and tested | Node SQLite contract tests including disk reopen; native bridge unverified |
| Foreground recording of four sports | Implemented but unverified | Real Expo Location adapter; physical outdoor runs required |
| Start/pause/resume/finish/discard/recovery | Implemented but unverified | State logic tested; lifecycle, permissions and storage failures on phones pending |
| Experimental auto-pause | Partially implemented | Speed/window gated; headless state and outdoor behavior require hardening |
| Native background recording | Blocked by service credentials/device/store setup | Task registration and native configuration present; development builds/device tests pending |
| Activity history, sport filters, detail, map, replay | Implemented but unverified | Bundled; phone runtime pending |
| Metadata/visibility/type editing, GPX, delete | Implemented but unverified | Export warns about full GPS; cloud deletion requires signed-in owner |
| Dashboard weekly/monthly goals and recent activities | Implemented but unverified | Derived only from real local workouts |
| Basic eight-week/yearly trends and longest outing | Partially implemented | Empty analytics tested; detailed per-workout graphs and physiological metrics absent |
| Heart rate / cycling power | Partially implemented | Backend model only, no wearable source |
| Email auth, verification, reset, sessions, logout | Blocked by service credentials/device/store setup | Real PKCE/SecureStore adapter; live emails/session tests pending |
| Name/username/bio profile | Implemented but unverified | Backend edit adapter and input limits; live tests pending |
| Avatar and private profile controls | Partially implemented | Private profile switch implemented; avatar picker/upload UI absent |
| Athlete units/goal/default visibility | Implemented but unverified | Local persistence; cloud settings synchronization absent |
| Cloud account deletion | Blocked by service credentials/device/store setup | Deno typechecked; real cascades/storage cleanup pending |
| Optional social login | Not started | Provider and native redirects need integration |
| Database/PostGIS/indexes/constraints/RLS | Implemented but unverified | Migration plus pgTAP fixtures; Docker daemon unavailable |
| Multi-user privacy verification | Blocked by service credentials/device/store setup | Run pgTAP on disposable Supabase; not executed here |
| Explicit account-owned cloud upload | Implemented but unverified | Transactional idempotent RPC adapter; no live Supabase |
| Cloud restore/automatic retries | Implemented but unverified | Missing-owner-workout restore and opt-in active-app retries; adapter tests pass, live service unverified |
| Multi-device conflicts/OS background sync | Not started | Existing local copies are retained; revision conflict protocol and native upload jobs pending |
| Explore native map | Blocked by service credentials/device/store setup | Android requires restricted Google key; unconfigured map fails gracefully |
| Basic waypoint routes/local geometry | Implemented but unverified | Straight-line distance, undo, save/open/delete; native interaction pending |
| Nearby provider search/elevation/road routing | Not started | Requires chosen licensed provider; no synthetic results |
| Offline base maps | Not started | Geometry-only storage is explicitly distinguished from tiles |
| Privacy zones | Partially implemented | Owner-only server storage; no shared-route redaction or zone list/delete UI |
| Athlete search/follow/unfollow/block/report | Implemented but unverified | Real adapters/RLS; abuse limits and live tests pending |
| Feed/kudos/comment creation | Partially implemented | Summary feed and write adapters; counts/read/delete comments need UI |
| Clubs and challenges | Partially implemented | Discovery and joining, schemas; creation/admin/club feeds absent |
| Notifications | Partially implemented | Private data model only; no push/local delivery |
| Moderation and social rate limiting | Partially implemented | Reports, blocks and atomic SQL write limits; operational tools/retention cleanup absent; SQL unverified |
| Segments, efforts, leaderboards | Partially implemented | Private schema/indexes and speed checks; matcher/rank APIs/UI absent |
| Monthly/club rankings and reliable step challenges | Not started | No trusted steps source; never infer steps from GPS |
| RevenueCat offerings/purchase/restore | Blocked by service credentials/device/store setup | SDK adapter and unavailable state; store sandbox validation pending |
| Pure client entitlement guard | Complete and tested | Missing/inactive/expired/invalid/lifetime cases tested |
| Server premium checks | Implemented but unverified | RevenueCat API fail-closed; Deno typecheck passes |
| Webhook/subscription-table reconciliation | Not started | Table is not entitlement truth |
| Advanced analytics/heatmaps/route tools/reports | Not started | Premium screen accurately describes incomplete feature scope |
| AI coach UI/consent/server integration | Blocked by service credentials/device/store setup | Server-only Responses API, summary minimization, 10/day quota; no real API invocation |
| AI conversation memory/personalized plans | Partially implemented | Independent question UI; persistent conversation/goals context absent |
| JSON local export | Implemented but unverified | Cloud account/social export absent |
| Local data clearing | Partially implemented | Individual workout/route deletion; bulk wipe absent |
| Notification preferences/help/legal | Partially implemented | About/legal draft copy; final legal documents/support contact pending |
| EAS development/preview/production config | Implemented but unverified | No builds/signing/submission executed |
| Icon/splash assets | Partially implemented | Expo template placeholders; final branding needed |
| Test/lint/typecheck/dependency review | Partially implemented | Local checks run; native UI tests and release security issues remain |

## Verification record

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed (zero warnings after fixes).
- `npm.cmd test`: 22 tests across 6 files passed, including account isolation, retry, concurrent edits/deletes and bounded server inputs.
- `npm.cmd run test:web`: two browser smoke tests passed; phone screenshot visually reviewed.
- `npx.cmd expo export --platform android --platform ios --platform web`: passed (JS/Hermes bundles, not native compilation).
- `npx.cmd expo install --check`: dependencies up to date.
- `expo-doctor`: 20/20 checks passed after adding expo-font.
- `npx.cmd --yes deno check ...`: both Edge Functions passed.
- `npm.cmd audit`: 5 high transitive findings in Expo tooling; see SECURITY.md.
- Docker binary detected, daemon unavailable. No ADB found. No native device tests, backend migration execution, purchases or OpenAI requests performed.

## Next continuation priorities

1. Obtain a development build and physically validate foreground GPS before relying on background recording.
2. Start Docker or connect an explicitly authorized disposable Supabase instance; execute and repair migrations/RLS tests.
3. Physically validate cloud restore/foreground retry, add multi-device conflict handling and OS sync jobs, migrate local append-only point tables and benchmark long recordings.
4. Add native UI interaction/permission/error tests, avatar/privacy controls, complete social read flows and spam/moderation controls.
5. Build and test server-only segment matching/rankings before exposing competition data.
6. Deliver premium features before enabling public products; configure/sandbox-test store and AI services.
