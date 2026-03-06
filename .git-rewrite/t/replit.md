# Private Wire Solar Calculator

## Overview
A full-stack web application for financial modeling of solar assets with private wire integration. Built with Express (backend) + React/Vite (frontend), using tRPC for type-safe API communication.

## Project Architecture

### Tech Stack
- **Frontend**: React 19, Vite 7, TailwindCSS 4, shadcn/ui components, wouter (routing), tRPC client
- **Backend**: Express 4, tRPC server, Drizzle ORM
- **Database**: MySQL (via mysql2 + drizzle-orm/mysql-core)
- **Language**: TypeScript 5.9
- **Package Manager**: pnpm

### Directory Structure
- `client/` — React frontend (Vite entry at `client/index.html`)
- `server/` — Express backend with tRPC routers
- `server/_core/` — Core server utilities (auth, OAuth, env, vite middleware)
- `shared/` — Shared types and constants between client/server
- `drizzle/` — Database schema, migrations, and relations

### Key Configuration
- Server runs on port 5000 (combined frontend + API)
- Vite serves frontend in dev mode; static files in production
- API routes under `/api/trpc`
- OAuth callback at `/api/oauth/callback`

### Environment Variables
- `DATABASE_URL` — MySQL connection string
- `VITE_APP_ID` — OAuth app identifier
- `VITE_OAUTH_PORTAL_URL` — OAuth portal URL
- `OAUTH_SERVER_URL` — OAuth server URL (backend)
- `JWT_SECRET` — Cookie/session signing secret
- `OWNER_OPEN_ID` — Admin user's OAuth open ID

### Scripts
- `pnpm dev` — Development server (tsx watch)
- `pnpm build` — Production build (Vite + esbuild)
- `pnpm start` — Production server
- `pnpm db:push` — Generate and run Drizzle migrations

## Recent Changes
- Configured for Replit environment: server binds to 0.0.0.0:5000
- Vite allowedHosts set to `true` for Replit proxy compatibility
- Graceful handling of missing OAuth configuration
