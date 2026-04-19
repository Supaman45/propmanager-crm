# CLAUDE.md

This file gives Claude Code the context it needs to work on Propli effectively. Read it first before any coding task.

## What Propli Is

Propli is a property management CRM positioned as a niche alternative to AppFolio. The target user is a property management operator with a portfolio weighted toward single-family homes. Core goal: simpler UX, transparent pricing, responsive support, fewer clicks than AppFolio.

Live at propli.app and propli.pro.

## Tech Stack

### Frontend

- React 18 with functional components and hooks  
- Vite as the dev server and build tool  
- Plain CSS with inline style objects (no Tailwind, no CSS modules)  
- Recharts for all data visualization and dashboards

### Backend

- Supabase (Postgres database, Auth, Storage, Edge Functions) for everything server-side  
- Supabase Edge Functions (Deno runtime, TypeScript) for any logic needing secrets or server execution, including Twilio webhooks and Claude API calls

### Integrations

- Twilio for two-way SMS (inbound webhook creates maintenance requests from keywords)  
- Claude API (Anthropic) for AI tenant screening, accessed via Supabase Edge Functions  
- Unsplash for property stock photography  
- randomuser.me for demo tenant avatars

### Infrastructure

- Vercel for frontend hosting, auto-deploys on push to `main`  
- GitHub for version control  
- Custom domains: propli.app (primary), propli.pro (secondary)

### Developer Tools

- Cursor AI as primary IDE with AI assistance  
- Claude Code for agentic coding tasks and refactors  
- Supabase CLI for Edge Function deployment and migrations

## Repository Layout

\~/Downloads/pm-crm/

├── src/                    // Frontend source

├── supabase/

│   └── functions/          // Edge Functions

│       ├── twilio-webhook/ // Inbound SMS handler

│       ├── send-sms/       // Outbound SMS

│       └── screen-tenant/  // AI tenant screening

├── public/                 // Static assets

├── index.html

├── vite.config.js

├── package.json

├── CLAUDE.md               // This file

├── AGENTS.md               // Agent-facing project spec

└── PROPLI-REFACTOR.md      // Active refactor plan

## Common Commands

\# Local development

npm run dev                          \# Start Vite dev server at localhost:5173

npm run build                        \# Production build

npm run preview                      \# Preview production build locally

\# Deployment

git push                             \# Triggers Vercel auto-deploy on main branch

\# Supabase Edge Functions

supabase functions deploy \<name\>     \# Deploy a specific function

supabase secrets set KEY=value       \# Set an Edge Function secret

supabase functions logs \<name\>       \# Tail logs for a function

## Database

Supabase Postgres with Row Level Security on every table.

Primary tables:

- `tenants` (with status: Prospect, Current, Late, Past)  
- `properties` (with property\_type: single\_family, multi\_family, etc.)  
- `maintenance_requests` (with source column, value 'sms' for auto-created)  
- `owners` and `owner_statements`  
- `tags` and `record_tags` (polymorphic tagging)  
- `files` (Supabase Storage references)  
- `schedule_events`  
- `expenses` and `payment_requests`  
- `sms_messages` (Twilio two-way SMS log)  
- `inspection_checklists`, `checklist_items`, `checklist_photos` (move-in/move-out, in progress)  
- `tenant_applications` and screening result tables

Storage buckets:

- `property-photos` (public)  
- `tenant-documents` (private)  
- `application-documents` (private)  
- `checklist-photos` (public)  
- `checklist-signatures` (public)

## External Service Config

### Twilio

- Number: \+1 888 404 9205 (toll-free)  
- Inbound webhook: `https://<supabase-project>.supabase.co/functions/v1/twilio-webhook`  
- Inbound SMS auto-matches tenant by phone (10-digit format, no formatting)  
- Keywords that auto-create maintenance requests: broken, leak, repair, fix, not working, emergency, urgent, ac, heat, water, door, lock

### Claude API

- Accessed via Supabase Edge Functions, never from the browser (CORS blocks direct calls)  
- Secret name: `ANTHROPIC_API_KEY` set in Supabase Edge Function secrets  
- Current model: `claude-sonnet-4-5-20250929`  
- Used for tenant screening

### Vercel

- Project auto-deploys on every push to `main`  
- Environment variables managed in Vercel dashboard  
- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Coding Conventions

### Components

- Functional components only, no class components  
- Named exports for all shared components  
- Default exports only for route-level page components  
- Component files: PascalCase (e.g., `TenantCard.jsx`)  
- Hook files: camelCase starting with `use` (e.g., `useTenants.js`)  
- Keep files under 300 lines. Split further if approaching the limit.

### Styling

- Use design tokens from `src/shared/styles/tokens.js` for every color, spacing, radius, shadow  
- No hex codes in component files after refactor completes  
- Inline style objects for component-specific styling  
- Global styles only in `src/shared/styles/globals.css`  
- Mobile breakpoint: 768px  
- Modals: centered overlay with backdrop  
- Detail panels: slide from right

### Supabase

- All queries go through feature-level hooks (`useTenants`, `useProperties`, etc.)  
- Never query Supabase directly from a UI component  
- Always handle loading and error states  
- Use RLS policies for security, never filter by user ID in application code alone

### State

- Local component state for UI-only concerns (modals, form inputs)  
- No Redux, no Zustand, no global state library  
- Data fetching handled in feature hooks, re-fetched on mutation

## Hard Rules

Never do these without explicit user approval:

1. Add a new npm package  
2. Change a database schema, RLS policy, or Edge Function signature  
3. Remove a feature, even if it looks unused  
4. Change a route path (e.g., `/owner-portal` stays `/owner-portal`)  
5. Commit secrets, API keys, or tokens to the repo  
6. Use `localStorage` or `sessionStorage` in artifact contexts  
7. Rewrite code from scratch when a refactor would work  
8. Deploy to production without local testing first

## Deployment Flow

1. Work on a feature branch for anything non-trivial  
2. Test locally with `npm run dev`  
3. Build locally with `npm run build` to catch build errors  
4. Push to branch, open PR, self-review the diff  
5. Merge to `main`  
6. Vercel auto-deploys within 2 minutes  
7. Smoke test propli.app after deploy

## Known Gotchas

- `src/App.jsx` is currently \~500KB and holds most of the UI. Refactor is in progress per PROPLI-REFACTOR.md.  
- Edge Function deploys need explicit `supabase functions deploy <name>`, git push does not deploy them.  
- Twilio toll-free numbers need verification before production SMS volume works reliably.  
- The owner portal lives at `/owner-portal` and has its own login flow separate from the admin app.  
- Demo data lives in a dev-only loader visible only to `strongsa@uw.edu`.  
- Row-level security policies block queries silently if misconfigured. Always check Supabase logs when a query returns empty unexpectedly.

## User Context

The user (Seri) is a solutions consultant by background with limited coding experience. Seri codes by prompting Cursor and Claude Code. Communicate in plain language, avoid jargon without explaining, and always walk through changes step by step. Seri prefers immediate testing and visual feedback over long theoretical explanations.

## Current Priorities

1. Structural refactor of `src/App.jsx` per PROPLI-REFACTOR.md  
2. Finish move-in/move-out checklist feature  
3. Scale demo data to 500 tenants and matching property count for upcoming operator demo  
4. Discovery call with family member who operates 500 doors, 70 percent single-family

Features explicitly deferred:

- AI Lease Analyzer (removed due to Edge Function timeout issues)  
- Payment processing integration (Stripe)  
- Calendar integrations (Google, Outlook)  
- Mobile native apps

## When in Doubt

- Check `PROPLI-REFACTOR.md` for active refactor scope  
- Check `AGENTS.md` for feature specifications  
- Ask the user before making architectural decisions  
- Favor small, testable changes over large rewrites  
- Run the dev server and click through the affected feature after every non-trivial change

