# Exotic

Exotic is a responsive code-and-word brain-teaser game built with React, Vite, Lucide, and Supabase Auth, Postgres, Realtime, and Edge Functions.

## Included

- 3 single-player difficulty tracks with 30 levels each (90 puzzle states)
- One clue per level, local progress, attempts, timers, hints, streaks, and rewards
- First-to-crack and 60-second time-attack multiplayer modes
- Host-selected rounds and categories; random category rotation for time attack
- Realtime room updates through Supabase Postgres Changes
- Realtime publication enabled for every application-owned table in the `public` schema, with RLS still controlling client visibility
- Sensitive puzzle-answer, translation-answer, and raw-submission tables remain publication members but are blocked from client SELECT/Realtime delivery by RLS and column privileges
- Supabase-authoritative profiles, progress, wallets, inventories, activity, rooms, and purchases
- No browser localStorage, sessionStorage, BroadcastChannel rooms, or fake local accounts
- Separate single-player and multiplayer wallets, inventories, shops, profiles, and routes
- Supabase email/password auth with database-backed profiles
- 16 complete locale dictionaries in `src/i18n/locales/`, plus shared UI and puzzle content keys in `src/i18n/`
- Localized puzzle prompts, word answers, numeral systems, and fallback hint templates
- Custom numeric keypad for digit answers and language-aware letters pad for word answers
- Localized word-answer puzzle types with canonical answers for multiplayer validation
- Arabic, Urdu, and Hindi numeral systems with locale-aware display and input normalization
- Light/dark themes with the requested button and icon contrast tokens
- No seeded users, fake rooms, fake purchases, or mock account records
- Database-backed solo and duel achievements with durable progress and unlock timestamps
- Live solo and duel leaderboards ranked from authoritative gameplay aggregates
- Registered usernames as the only public player identity; account email remains private
- Public image/video profile media buckets with authenticated owner-folder uploads and muted-by-default video avatars

## Run locally

```bash
npm install
npm run dev
```

Validate the translation key surface with:

```bash
npm run check:i18n
```

The app requires Supabase environment variables and does not fall back to browser persistence. Configure `.env` from `.env.example`, link the CLI, push migrations and seeds, and deploy the Edge Functions before running the app.

## Vercel deployment

`vercel.json` configures the Vite build and SPA route fallback. Before deploying, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`) in the Vercel project's Environment Variables. Never add the Supabase service-role key or database password to Vercel.

## Supabase setup

1. Install the Supabase CLI and authenticate with a **personal access token**:
   ```bash
   npm install
   npx supabase login
   ```
2. Link the project:
   ```bash
   npx supabase link --project-ref <PROJECT_REF>
   ```
3. Push all migrations and the configured seed files:
   ```bash
   npm run db:seed
   ```
4. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and the publishable key. Keep the database password, service-role key, and CLI token server-side only; never prefix them with `VITE_`. Rotate any credentials that were pasted into chat before production use.
5. Deploy the Edge Functions:
   ```bash
   npx supabase functions deploy ai-riddle --project-ref <PROJECT_REF>
   npx supabase functions deploy multiplayer-action --project-ref <PROJECT_REF>
   ```
6. Add `OPENROUTER_API_KEY` and `APP_URL` as Edge Function secrets. Set `APP_URL` to the deployed Vercel origin (for example, `https://your-app.vercel.app`). The AI function discovers currently available zero-cost `:free` models, caches that catalog briefly, and automatically falls through on rate limits, expired models, timeouts, or provider outages. The API key is never exposed to the browser.

Because the browser storage policy is strict, the Supabase client keeps the auth session in memory only (`persistSession: false`); a page reload requires signing in again. This avoids localStorage/sessionStorage while keeping all durable state in Postgres.

Migrations `001` through `017` are included. The migrations intentionally do not insert demo users or rooms. The configured seed files provide reviewed puzzle, shop, locale catalog, and localized word-answer validation data without creating player-owned data. Migration `010` adds database-backed achievement definitions and progress, ranked leaderboard RPCs, canonical username synchronization, and authenticated profile media buckets/policies; migration `011` hardens the leaderboard response contract; migration `012` makes multiplayer timing and winner aggregation server-derived and idempotent; migrations `013`–`015` enable Realtime for all public application tables while blocking sensitive answer/submission delivery; migration `016` adds a safe global leaderboard revision signal; migration `017` preserves safe room winner snapshots.

## Route map

- `/` dashboard
- `/single` single-player map
- `/single/play` active solo puzzle
- `/single/shop` solo shop and solo wallet
- `/single/profile` solo profile
- `/single/achievements` real solo achievements
- `/single/leaderboard` real solo rankings
- `/multi` multiplayer lobby and active match
- `/multi/shop` duel shop and duel wallet
- `/multi/profile` duel profile
- `/multi/achievements` real duel achievements
- `/multi/leaderboard` real duel rankings
- `/achievements` and `/leaderboard` redirect to the solo routes
- `/settings` preferences, theme, locale, and database reset
- `/single/auth` and `/multi/auth` separated auth entry points
- `/auth` account entry

## Realtime architecture

`src/lib/realtime.js` provides the shared authenticated subscription manager and hooks:

- `useRealtimeSubscription` / `useRealtimeTable` for table-level events
- `useRealtimeInvalidation` for debounced refreshes
- `useRealtimeStatus` for connection state
- `realtimeManager`, `startRealtime`, `stopRealtime`, and `emitRealtimeTableChange` for app-level/manual invalidation

The App provider keeps one authenticated channel alive while the user is signed in, coalesces account-state changes, and refreshes the dashboard, profile, settings, shop, achievements, and leaderboard views without navigation. Room-specific subscriptions remain isolated to the active multiplayer room. Secret-bearing tables are never client-subscribed.

## Notifications

`src/components/NotificationToaster.jsx` provides a custom shadcn-style notification stack for the entire app, including authentication screens. Notifications use translated titles and messages, semantic live-region announcements, tone-specific icons, hover/focus pause, progress bars, close and clear-all actions, responsive/RTL positioning, and reduced-motion-aware enter/exit animations. Existing `showToast(...)` calls are automatically routed through the new queue; new code can use `notify(...)` with an optional tone and duration.

## Custom validation

Native browser constraint validation is disabled for the app form. `src/components/FormValidation.jsx` renders translated, animated inline validation states, while `src/pages/Auth.jsx` and `src/pages/Profile.jsx` perform their own field checks. Answer inputs now use controlled character sanitization instead of native length constraints.

## Data model

`supabase/migrations/001_exotic.sql` through `004_match_stats.sql` define the core schema, room lifecycle, rewards, and match statistics. `005_localized_answers.sql` adds word-answer support, `006_supabase_first_state.sql` adds preferences and app-state hydration, `007_server_authority_and_rls.sql` locks private tables behind server-side RPCs, validates solo answers, and publishes only safe realtime state, `008_room_code_compatibility.sql` provides portable room-code generation, `009_signup_identity_validation.sql` adds normalized usernames and signup availability checks, and `010`–`017` add achievements, leaderboard/media persistence, realtime publication, revision signals, and safe room projections.
