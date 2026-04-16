# 1. Product Requirements Document

## Product Name
**ScoreAI** (working name): premium, multi-sport analytics SaaS with AI insights and screenshot intelligence.

## Business Goals
- Build a trustworthy analytics product for sports discovery, not a betting-style UI.
- Convert free users to Pro/Premium via clear AI and advanced-stat value.
- Retain users through personalization (favorites, reminders, history, insights).
- Support multi-provider sports data to reduce vendor lock-in risk.
- Keep architecture ready for B2C growth and later B2B/API licensing.

## Success Metrics (MVP + Growth)
- Activation: `%` users who favorite at least 1 team and view 1 match detail.
- Engagement: DAU/WAU, average sessions/week, AI insights viewed per active user.
- Conversion: free->paid conversion rate, plan upgrade rate, churn.
- Product Quality: page speed, API p95 latency, error rate, uptime.
- AI Quality: prediction view-through, analysis completion rate, user feedback score.

## Target Users
- Sports fans wanting clean live/upcoming/results in one place.
- Data-driven users wanting advanced stats + AI explanations.
- Users who share screenshots and want context-aware interpretation.
- Operators/admins managing content health, ticket links, and usage.

## Module Scope
- Landing, Auth, Dashboard, Multi-sport catalog, Match center, Match details.
- AI prediction module and screenshot AI analysis module.
- Favorites/personalization, Search/discovery, Notifications.
- Subscription, payment abstraction, billing, access gating.
- Ticket redirect module.
- Admin console with provider/API health and moderation hooks.

## Free vs Premium Feature Mapping

| Feature | Free | Pro | Premium |
|---|---|---|---|
| Live scores (limited windows) | Yes (limited) | Yes | Yes |
| Basic match stats | Limited | Full | Full |
| Saved matches/favorites | Limited count | Higher | Unlimited |
| AI match prediction | No | Standard | Advanced + priority insights |
| Screenshot AI analysis | No | Yes (monthly cap) | Yes (higher cap + history depth) |
| Analysis history | Limited | Full | Full + export-ready |
| Personal recommendations | Basic | Advanced | Advanced + premium ranking |
| Notifications | Basic | Enhanced | Enhanced + priority |

## AI Prediction Flow
1. User opens match details.
2. Frontend requests prediction endpoint.
3. Backend gathers normalized form/H2H/home-away and optional injury metadata.
4. Feature builder computes model input vector + contextual text blocks.
5. AI adapter requests external model using `AI_API_KEY`.
6. Response normalized into strict JSON contract:
   - winProbabilities
   - likelyScoreRange
   - confidence
   - keyReasons
   - uncertainty
7. Result stored in `ai_predictions` and returned with cache metadata.
8. UI renders premium card with bars, confidence badge, explanation accordion.

## Screenshot Analysis Flow
1. User uploads screenshot via drag/drop + optional note + optional linked match.
2. Asset stored via storage adapter (local or cloud) and metadata persisted.
3. Backend sends image URL/base64 + note + match context to AI analyzer.
4. AI returns structured JSON with sections:
   - detectedContent
   - matchContext
   - keyObservations
   - interpretation
   - uncertainty
   - summary
5. Result saved to `screenshot_analyses`; usage counters updated by plan limits.
6. UI shows processing state -> result view -> history entry.
7. If AI confidence low, show explicit limitations and avoid over-assertive conclusions.

## Payment & Subscription Flow
1. User selects plan on pricing/subscription page.
2. `PaymentService` creates checkout session with selected provider (Stripe first).
3. User redirected to provider checkout.
4. Provider webhook updates `payment_transactions` and `subscriptions`.
5. Entitlements recalculated and cached in user session profile.
6. UI shows success/failure pages and billing history.
7. Future adapters can implement same `PaymentProvider` interface (Payme/Click).

## Open API Integration Strategy (High Level)
- Provider adapter layer: `SportsProvider` interface + per-provider implementation.
- Data normalization into internal DTOs (`NormalizedMatch`, `NormalizedTeam`, ...).
- Per-endpoint caching and rate-limit aware fetch queue.
- Provider health metrics + fallback provider order.
- Never expose raw provider payloads to frontend.

## Admin Scope
- User/subscription overview and lightweight moderation.
- Ticket link CRUD + domain trust validation.
- Featured match overrides.
- AI usage monitoring (requests, failures, latency buckets).
- Provider health and stale-data indicators.
- Admin action logs.

## UI/UX Principles
- Minimal premium surfaces, one accent color, whitespace-led layout.
- Editorial data storytelling blocks for insights.
- Clear premium gating without manipulative dark patterns.
- Consistent loading, empty, error states.
- Keyboard-friendly interactions and accessible contrast.
- Motion used for hierarchy and state transitions, not decoration.

## Technical Constraints
- TypeScript across frontend/backend.
- PostgreSQL normalized schema with migration path.
- JWT access + refresh tokens with rotation.
- Secure env management; no provider token leakage to client.
- Modular architecture for provider/payments/AI swaps.

---

# 2. User Personas

## Persona A: Regular Sports Fan
- Name: Alex, 27, mobile-first.
- Goal: Check scores and upcoming matches quickly.
- Needs: Fast navigation, clean match cards, reminders.
- Pain points: Noisy apps and ad-heavy interfaces.

## Persona B: Premium Analytical User
- Name: Samira, 34, desktop + tablet.
- Goal: Compare form, advanced stats, AI insights.
- Needs: Reliable data context, confidence labels, trend visuals.
- Pain points: Shallow stats and unexplainable predictions.

## Persona C: Screenshot Analysis User
- Name: Timur, 30.
- Goal: Upload screenshots and understand context instantly.
- Needs: Clear extraction + interpretation + limitations.
- Pain points: Generic OCR outputs without sports context.

## Persona D: Admin/Operator
- Name: Marina, 38.
- Goal: Keep data quality and monetization healthy.
- Needs: Provider health, user/subscription views, moderation tools.
- Pain points: Hidden failures and difficult override workflows.

---

# 3. E2E User Flows

## Flow 1: Register -> Dashboard
- Given user opens `/register`
- When user submits valid form and verifies email (or mock-verified)
- Then user is logged in, access token issued, refresh stored securely
- And user lands on `/dashboard` with onboarding prompts (favorite sport/team)

## Flow 2: Explore sport -> Match details
- Given user opens `/sports/football`
- When user applies league/date filters and selects a match
- Then app navigates to `/matches/:id`
- And shows live status, timeline, stats, related matches, ticket links

## Flow 3: Upgrade and unlock prediction
- Given free user opens premium AI section on a match
- When user clicks Upgrade -> selects Pro -> completes payment
- Then webhook marks subscription active
- And UI unlocks full prediction content without full page reload

## Flow 4: Screenshot upload and analysis
- Given premium user opens `/upload-analysis`
- When user uploads image + note and submits
- Then UI shows queued/processing states with cancel/retry
- And result page renders 6 analysis sections + save to history

## Flow 5: Ticket redirection
- Given match has providers configured
- When user clicks `Buy Ticket`
- Then app opens trusted external URL in new tab with rel security
- And logs click event for analytics

## Flow 6: Admin updates ticket links
- Given admin opens `/admin/tickets`
- When admin adds provider URL and match mapping
- Then backend validates provider domain and persists link
- And change is logged in `admin_logs`

## Flow 7: Search and discovery
- Given user focuses global search
- When user types 3+ chars
- Then instant suggestions appear grouped by team/player/league/match
- And keyboard navigation supports arrows + enter + esc

## Flow 8: Notification reminder
- Given user favorites a team and enables reminders
- When match is near start window
- Then reminder notification is created and shown in user center

---

# 4. Feature Chunk Breakdown

## Chunk 1: Project Setup + Design System
- Goal: production-ready mono-structure, shared tokens/components, routing shell.
- Included features: repo setup, web/api/db/shared packages, base auth shell, route skeletons, premium visual baseline.
- Frontend files: app shell, theme tokens, reusable UI primitives, page placeholders.
- Backend files: Express bootstrap, health endpoint, module architecture skeleton.
- API requirements: `/api/v1/health`.
- DB impact: initial prisma schema skeleton.
- Edge cases: empty states for all placeholder pages.
- Done criteria: app runs, consistent design system in place, API health responds.

## Chunk 2: Auth System
- Goal: secure register/login/refresh/reset flows.
- Included features: JWT rotation, password hashing, validation, protected routes.
- Frontend files: auth forms, validation, password strength, auth store.
- Backend files: auth controller/service/repo, token service, email stub.
- API requirements: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot`, `/auth/reset`, `/auth/verify`.
- DB impact: users, refresh tokens/sessions, verification/password reset tokens.
- Edge cases: token reuse, brute-force throttling, expired links.
- Done criteria: E2E auth passing.

## Chunk 3: Landing Page
- Goal: premium conversion-ready public experience.
- Included features: hero, live preview, sports strip, AI showcase, pricing teaser.
- Frontend files: landing sections + animation.
- Backend files: optional public featured feed endpoint.
- API requirements: `/public/featured`.
- DB impact: optional featured flags.
- Edge cases: no featured data fallback.
- Done criteria: responsive Lighthouse-friendly landing.

## Chunk 4: Multi-Sport Listing Pages
- Goal: scalable cross-sport browsing.
- Included features: sports index, sport detail pages, filters.
- Frontend files: sport pages, filter controls, match cards.
- Backend files: sport/leagues/matches read endpoints.
- API requirements: `/sports`, `/sports/:slug`, `/matches` query filters.
- DB impact: sports, leagues, teams, matches.
- Edge cases: provider missing fields.
- Done criteria: 5+ sports supported.

## Chunk 5: Match Center
- Goal: central live/upcoming/completed board.
- Included features: tabs, search, league filter, save match.
- Frontend files: match center screens.
- Backend files: match query service with caching.
- API requirements: `/matches/live`, `/matches/upcoming`, `/matches/completed`.
- DB impact: favorites linkage.
- Edge cases: live status race conditions.
- Done criteria: low-latency browsable center.

## Chunk 6: Match Detail Page
- Goal: analytics-rich match intelligence page.
- Included features: timeline, stats, comparison charts, form blocks.
- Frontend files: match details modules by sport.
- Backend files: detail aggregation endpoints.
- API requirements: `/matches/:id`, `/matches/:id/stats`, `/matches/:id/events`.
- DB impact: match_statistics, match_events.
- Edge cases: partial stats by sport/provider.
- Done criteria: polished multi-sport detail views.

## Chunk 7: Favorites & Personalization
- Goal: user-centered curation and recommendations.
- Included features: favorites CRUD, recommendations, recent views.
- Frontend files: favorites page/dashboard widgets.
- Backend files: personalization service.
- API requirements: `/favorites`, `/recommendations`.
- DB impact: favorites, recent views table (or event log).
- Edge cases: duplicate favorites, deleted entities.
- Done criteria: persistent personalized dashboard.

## Chunk 8: Subscription & Payment
- Goal: monetize with clean plan management.
- Included features: pricing, checkout initiation, billing history, cancel/change plan.
- Frontend files: pricing/subscription/billing screens.
- Backend files: payment adapter + webhook handlers.
- API requirements: `/subscriptions/*`, `/payments/*`, webhook endpoint.
- DB impact: subscriptions, payment_transactions.
- Edge cases: webhook retries, partial payment states.
- Done criteria: end-to-end subscription lifecycle.

## Chunk 9: Ticket Redirect Module
- Goal: trusted outbound ticket workflow.
- Included features: provider list on match page, click tracking.
- Frontend files: ticket provider UI block.
- Backend files: ticket link service/admin management.
- API requirements: `/matches/:id/tickets`, `/admin/tickets`.
- DB impact: ticket_links.
- Edge cases: invalid/untrusted domains.
- Done criteria: secure multi-provider redirect.

## Chunk 10: AI Prediction Module
- Goal: explainable premium prediction card.
- Included features: model input pipeline, structured output, confidence handling.
- Frontend files: prediction panel, reason accordion, premium gating.
- Backend files: ai prediction service + caching.
- API requirements: `/matches/:id/prediction`.
- DB impact: ai_predictions.
- Edge cases: low-confidence handling and stale inputs.
- Done criteria: trustworthy and explainable predictions.

## Chunk 11: Screenshot Analysis Module
- Goal: context-rich image analysis with history.
- Included features: upload UI, processing states, structured analysis output, history.
- Frontend files: uploader, result cards, history page.
- Backend files: upload pipeline, AI image analyzer service.
- API requirements: `/analysis/upload`, `/analysis/:id`, `/analysis/history`.
- DB impact: uploaded_assets, screenshot_analyses, plan usage counters.
- Edge cases: OCR ambiguity, unsupported formats, low-confidence outputs.
- Done criteria: robust premium screenshot intelligence workflow.

## Chunk 12: Dashboard
- Goal: complete personalized command center.
- Included features: plan status, history widgets, favorites, suggested matches.
- Frontend files: dashboard modules.
- Backend files: aggregated dashboard endpoint.
- API requirements: `/dashboard/overview`.
- DB impact: none major (reads aggregated data).
- Edge cases: first-time users (empty states).
- Done criteria: strong retention-oriented dashboard.

## Chunk 13: Admin Panel
- Goal: operational control center.
- Included features: users, subscriptions, tickets, AI usage, provider health.
- Frontend files: admin table/detail screens.
- Backend files: admin endpoints + RBAC guard.
- API requirements: `/admin/*`.
- DB impact: admin_logs.
- Edge cases: unauthorized access, sensitive-field redaction.
- Done criteria: usable lightweight admin operations.

## Chunk 14: Polish, Performance, Responsiveness
- Goal: production hardening.
- Included features: skeletons, lazy loading, error boundaries, perf pass, a11y pass.
- Frontend files: cross-cutting optimization.
- Backend files: cache tuning, rate limits, observability hooks.
- API requirements: no major new endpoints.
- DB impact: indexes and query tuning.
- Edge cases: high traffic spikes.
- Done criteria: release-ready quality bar.

---

# 5. Recommended Folder Structure

```txt
.
├── apps
│   ├── web
│   │   ├── src
│   │   │   ├── app
│   │   │   │   ├── providers
│   │   │   │   ├── routes
│   │   │   │   └── layout
│   │   │   ├── components
│   │   │   │   ├── ui
│   │   │   │   ├── charts
│   │   │   │   ├── cards
│   │   │   │   └── forms
│   │   │   ├── features
│   │   │   │   ├── auth
│   │   │   │   ├── matches
│   │   │   │   ├── sports
│   │   │   │   ├── predictions
│   │   │   │   ├── analysis
│   │   │   │   ├── billing
│   │   │   │   ├── dashboard
│   │   │   │   └── admin
│   │   │   ├── hooks
│   │   │   ├── lib
│   │   │   ├── styles
│   │   │   └── types
│   │   └── ...
│   └── api
│       ├── src
│       │   ├── config
│       │   ├── core
│       │   ├── modules
│       │   │   ├── auth
│       │   │   ├── users
│       │   │   ├── sports
│       │   │   ├── matches
│       │   │   ├── predictions
│       │   │   ├── analysis
│       │   │   ├── subscriptions
│       │   │   ├── payments
│       │   │   ├── tickets
│       │   │   ├── notifications
│       │   │   └── admin
│       │   ├── adapters
│       │   │   ├── sports-providers
│       │   │   ├── payment-providers
│       │   │   ├── ai
│       │   │   └── storage
│       │   ├── db
│       │   └── shared
├── packages
│   ├── shared
│   └── db
│       ├── prisma
│       └── migrations
└── docs
```

---

# 6. Database Schema Proposal

## Core Tables
- users(id, full_name, email, password_hash, favorite_sport_id nullable, role, email_verified_at, created_at, updated_at)
- refresh_tokens(id, user_id, token_hash, expires_at, revoked_at, ip, user_agent, created_at)
- subscriptions(id, user_id, plan, status, provider, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at)
- payment_transactions(id, user_id, subscription_id nullable, provider, provider_txn_id, amount, currency, status, metadata jsonb, created_at)
- sports(id, slug, name, is_active, created_at)
- leagues(id, sport_id, provider_ref, slug, name, country, logo_url, created_at, updated_at)
- teams(id, sport_id, league_id nullable, provider_ref, name, short_name, logo_url, metadata jsonb, created_at, updated_at)
- players(id, team_id nullable, sport_id, provider_ref, name, position, metadata jsonb, created_at, updated_at)
- matches(id, sport_id, league_id, home_team_id, away_team_id, provider_ref, status, start_time, venue, score_home, score_away, metadata jsonb, created_at, updated_at)
- match_statistics(id, match_id, side enum(home/away), stat_key, stat_value, created_at)
- match_events(id, match_id, minute, event_type, team_id nullable, player_name nullable, payload jsonb, created_at)
- ticket_links(id, match_id, provider_name, provider_logo_url nullable, url, is_trusted, created_at, updated_at)
- favorites(id, user_id, target_type enum(team/sport/league/match), target_id, created_at)
- ai_predictions(id, match_id, model_name, input_snapshot jsonb, output jsonb, confidence, created_at)
- uploaded_assets(id, user_id, storage_provider, storage_key, mime_type, size_bytes, original_name, created_at)
- screenshot_analyses(id, user_id, asset_id, linked_match_id nullable, note text nullable, model_name, result jsonb, confidence nullable, created_at)
- notifications(id, user_id, type, title, body, read_at nullable, metadata jsonb, created_at)
- admin_logs(id, admin_user_id, action, entity_type, entity_id, payload jsonb, created_at)

## Key Indexes
- users(email unique)
- matches(sport_id, league_id, start_time)
- matches(status, start_time)
- favorites(user_id, target_type, target_id unique composite)
- ai_predictions(match_id, created_at desc)
- screenshot_analyses(user_id, created_at desc)
- ticket_links(match_id)

## Relationship Notes
- `sport -> league -> matches` is canonical chain.
- `teams` can appear across tournaments; league_id optional to avoid over-constraining.
- AI tables keep input snapshots for reproducibility.

---

# 7. External API Integration Strategy

## Abstractions
- `SportsProvider` interface:
  - `getSports()`
  - `getLeagues(sport)`
  - `getMatches(filters)`
  - `getMatchDetails(matchId)`
  - `getMatchStats(matchId)`
- Provider adapters implement mapping into normalized DTOs.

## Data Pipeline
1. Fetch from provider client.
2. Validate raw payload with schema guards.
3. Normalize to internal DTO.
4. Cache (memory + DB snapshots where needed).
5. Serve API from normalized models.

## Reliability
- Circuit breaker and fallback provider order.
- Per-provider timeout/retry policy.
- Health table/metrics for admin visibility.

## Security
- Provider keys only in backend env.
- Request signing for webhook-like integrations.

---

# 8. UI/UX Design System

## Visual Tokens
- Palette:
  - `bg`: near-white
  - `fg`: near-black
  - `muted`: gray scale
  - `accent`: muted blue (`#3A6FF7` range)
- Radius scale: 8 / 12 / 16 / 24
- Shadows: soft low-elevation, sparse high-elevation use
- Border style: low-contrast neutral borders

## Typography
- Heading font: `Manrope` (expressive yet clean)
- Body font: `Plus Jakarta Sans`
- Numeric/stat font fallback: `JetBrains Mono` for select stat labels

## Components
- `Button`, `Chip`, `Card`, `StatTile`, `SectionHeader`, `Skeleton`, `EmptyState`, `PremiumGate`, `SearchCommand`.
- Motion: subtle stagger/fade/slide for section entry.
- Chart style: thin strokes, restrained color, clear labels, no visual noise.

## Interaction Rules
- Clear hover/active/focus states.
- Keyboard support for all controls.
- Empty states with guidance CTA.
- Loading skeletons in list/detail/analysis contexts.

## Theme
- Light required.
- Dark optional via token inversion and contrast-safe chart palette.

---

# 9. First Chunk Detailed Plan

## Chunk
**Chunk 1: Project setup + design system + route/backend skeleton**

## Chunk Requirements Restated
- Initialize scalable monorepo with `web`, `api`, `shared`, `db` packages.
- Implement premium baseline UI shell and design tokens.
- Add route scaffolding for public/protected/admin surfaces.
- Bootstrap backend with production-style module organization.
- Add PostgreSQL schema skeleton (Prisma) reflecting core entities.

## File Structure (Chunk 1)
- Root workspace configs and scripts.
- `apps/web`: Vite + React + Tailwind + framer-motion + recharts skeleton.
- `apps/api`: Express + zod + modular routes.
- `packages/shared`: shared TS contracts.
- `packages/db`: Prisma schema.

## Components (Chunk 1)
- UI primitives: `Button`, `Card`, `Badge`, `Skeleton`, `SectionTitle`.
- Layout: top nav, shell container, footer.
- Pages (scaffold): landing, sports, matches, pricing, auth, dashboard, upload analysis, admin.

## Endpoints (Chunk 1)
- `GET /api/v1/health`
- `GET /api/v1/meta` (basic API metadata and version)

## DB Impact (Chunk 1)
- Add initial Prisma schema for all required entities with enums and relations.

## UI States (Chunk 1)
- base loading skeletons
- empty panel cards
- premium lock card placeholder

## Edge Cases (Chunk 1)
- unknown route fallback
- API unavailable fallback in frontend status badge
- absent env values handled with safe defaults in dev

## Done Criteria (Chunk 1)
- App shell compiles with typed routes.
- Backend starts and returns health.
- Shared types imported by web/api.
- Prisma schema includes all planned tables.

---

# 10. Begin Implementation Chunk by Chunk

Implementation starts with **Chunk 1** only in this iteration.
