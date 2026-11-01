# Product scope and behavior

The app starts empty and uses only workouts recorded by the user or real records returned by configured services. The original charcoal/orange design uses accessible button heights, theme-aware colors, readable text, flexible rows, explicit loading/error/empty states, and native navigation. Full accessibility, tablet, contrast, and device screenshot audits are pending.

## Free local journal

Home shows real weekly/monthly totals, weekly goal progress and recent activity cards. Record supports four outdoor sport types and explicit foreground permissions. Activities supports sport filters, metric detail, route replay, kilometer splits, metadata/visibility edits, deletion, and full GPX export. Analytics adds descriptive weekly/yearly totals and longest recorded workout. Settings changes units, theme, goal, default visibility and experimental auto-pause. Anonymous recording works without cloud configuration.

Activity pace uses moving time, active time excludes pauses, and elapsed time includes them. Reliable filtered positive altitude changes form the elevation-gain estimate; missing or poor altitude contributes no gain. No invented heart-rate, steps, power, readiness, or injury scores appear.

## Explore

Native map and basic waypoint builder. Routes save geometry to the device. Search, road snapping, turn instructions, elevation providers, route cloud sync and offline tile packs are not implemented. Map key requirements and costs are described in SETUP.md.

## Account and community

Email/password signup/signin, reset and PKCE confirmation callback, editable name/username/bio and profile privacy, SecureStore session persistence, logout and secure cloud deletion function. Profile photo is schema/storage only. Explicit sync uploads linked workouts, restores missing owner workouts, and enables foreground retry while the app is active. Stop retries in Settings. Cross-device edits to existing local copies are not reconciled yet.

Real adapters cover athlete prefix search, follow/unfollow, block/report, summary feed, kudos, posting comments, discovering/joining public clubs and challenges. These need a configured backend, live RLS verification and end-to-end tests. Viewing/deleting comments, reaction counts, unfollow state, creating/managing clubs, club feeds, notifications delivery and moderator tooling are incomplete.

Private activity summaries are owner-only; follower summaries require a follow and no block. Private profiles cannot receive new follows in this initial model; follow requests are not implemented. Public raw GPS sharing is disabled for every audience except the owner. Privacy-zone storage does not alter GPX exports.

## Plus and AI

The subscription screen loads real store offerings and supports purchase/restore. It explicitly lists incomplete premium features so an empty offering never pretends to unlock them. Backend entitlement verification uses RevenueCat directly, not the editable device state or a client-written subscription table.

AI coach has a consent UI and a bounded server-side Responses API adapter. It summarizes synced training and supports independent questions, conservative recommendations, no diagnoses and no injury prediction. Until configured and tested with real services it is unverified. No simulated coaching response is substituted.

Heatmaps, personalized plans, advanced comparisons, fitness/fatigue modeling, training reports, advanced route tools, advanced leaderboards and offline base maps remain on the roadmap. Do not launch paid subscriptions until delivered and sandbox-tested.
