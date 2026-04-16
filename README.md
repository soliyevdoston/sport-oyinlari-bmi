# ScoreAI Platform

Premium multi-sport analytics SaaS starter (Chunk 1).

## Workspaces
- `apps/web` - React + Vite + Tailwind UI
- `apps/api` - Express API
- `packages/shared` - shared contracts/types
- `packages/db` - Prisma schema for PostgreSQL

## Run
1. Install dependencies: `npm install`
2. Copy env: `cp .env.example .env`
3. For web env: `cp apps/web/.env.example apps/web/.env`
4. Start web + api: `npm run dev`

## Vercel Deploy (Single Project)
This repo is configured to deploy both frontend and API in one Vercel project via root [`vercel.json`](./vercel.json).

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, import the repo as a new project.
3. Keep **Root Directory** as repository root (`.`).
4. Do not override build/output commands manually (they are defined in `vercel.json`).
5. Add these environment variables in Vercel Project Settings:
   - `NODE_ENV=production`
   - `API_PREFIX=/api/v1`
   - `JWT_ACCESS_SECRET=<strong-random-secret>`
   - `JWT_REFRESH_SECRET=<strong-random-secret>`
   - `JWT_ACCESS_TTL=15m`
   - `JWT_REFRESH_TTL=7d`
   - `CORS_ORIGIN=*` (or tighten later, e.g. `https://your-domain.com`)
   - `AI_API_KEY=<your-openai-key>` (optional, AI fallback works without it)
   - `AI_MODEL_TEXT=gpt-4.1-mini` (optional)
   - `GUARDIAN_API_KEY=test` (or your real key)
6. Redeploy.

Quick production checks:
- App page opens: `/`
- API health: `/api/v1/health`
- News API: `/api/v1/news?limit=5`

Notes:
- Frontend now defaults to relative API base (`/api/v1`) in production.
- Current data store is in-memory for MVP/demo; for high-scale production move users/sessions/subscriptions to PostgreSQL/Redis.

## Netlify Deploy (Single Site + Functions)
This repo is also configured for Netlify via [`netlify.toml`](./netlify.toml):
- SPA publish directory: `apps/web/dist`
- API served by Netlify Function: `netlify/functions/api.ts`
- API path: `/api/v1/*`

Steps:
1. Import repository in Netlify.
2. Keep project root as repository root (`.`).
3. Use default build settings from `netlify.toml` (no manual override needed).
4. Add environment variables:
   - `NODE_ENV=production`
   - `API_PREFIX=/api/v1`
   - `JWT_ACCESS_SECRET=<strong-random-secret>`
   - `JWT_REFRESH_SECRET=<strong-random-secret>`
   - `JWT_ACCESS_TTL=15m`
   - `JWT_REFRESH_TTL=7d`
   - `CORS_ORIGIN=*` (or your domain)
   - `AI_API_KEY=<optional>`
   - `AI_MODEL_TEXT=gpt-4.1-mini` (optional)
   - `GUARDIAN_API_KEY=test` (or real key)

Post-deploy checks:
- `/`
- `/matches`
- `/api/v1/health`
- `/api/v1/news?limit=5`

## Demo credentials
- Admin: `admin@scoreai.dev` / `Admin123!`
- User: `user@scoreai.dev` / `User123!`

## Current status
- Planning/architecture complete in `docs/architecture-plan.md`
- Chunk 1 scaffold implemented
- Real auth + admin role API implemented
- Multi-sport live feed integrated from ESPN public scoreboard endpoints

## Main API endpoints
- `GET /api/v1/sports/catalog`
- `GET /api/v1/sports/feed?sport=football|basketball|tennis|mma|volleyball`
- `GET /api/v1/sports/event/:id?sport=...`
- `GET /api/v1/sports/event/:id/summary?sport=...`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/admin/users` (admin token required)
