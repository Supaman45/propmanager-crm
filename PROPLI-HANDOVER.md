# PROPLI HANDOVER DOC

A complete context dump for any AI assistant or new Claude project picking up Propli development cold. Drop this file into project knowledge (or commit it to the repo root). It replaces the need to re-explain the stack, the history, the conventions, or the active workstreams.

Last updated: 2026-05-16 (section 7 corrected against migrations after Claude Code flagged 7 schema mismatches during 500-door demo generator task)
Maintainer: Seri (strongsa@uw.edu)

---

## 1. What Propli Is

Propli is a property management CRM positioned as a niche, simpler alternative to AppFolio. The target user is a property management operator with a portfolio weighted toward single-family homes.

Differentiation strategy, anchored to AppFolio's known complaints:

- Transparent pricing (AppFolio has hidden fees)
- Human customer support (AppFolio support is widely criticized)
- Streamlined UI with fewer clicks (AppFolio UI is complex)
- Stronger owner portal (AppFolio's owner portal is limited)
- Cleaner accounting flows (AppFolio accounting frustrates operators)

Live URLs:
- Primary: propli.app
- Secondary: propli.pro

First customer target: a family member who manages roughly 500 doors, with a portfolio about 70 percent single-family. The discovery angle is real, the customer is real, and the wedge is the single-family focus that AppFolio handles poorly.

---

## 2. Founder Context (Seri)

Seri is a solutions consultant by background, not a software engineer. The product vision emerged from doing discovery calls, uncovering pain points, and understanding business operations.

Working style:

- Builds by prompting Cursor and Claude Code rather than writing code directly
- Phase-by-phase execution with manual browser verification between phases
- Prefers explicit stop-and-approve gates over long autonomous runs
- Production-oriented: frequent git pushes to Vercel, often tests in the live environment
- Uses restore-point docs and AGENTS.md style specs to maintain context across sessions and AI tools
- Decisions grounded in identified AppFolio complaints and operator pain points, not pure technical possibility

Communication preferences for any AI working with Seri:

- Plain language, explain jargon when used
- Walk through changes step by step
- Favor immediate testing and visual feedback over long theoretical explanations
- Ask before making architectural decisions
- Favor small testable changes over large rewrites
- Avoid em dashes, semicolons, hashtags, asterisks, markdown formatting in conversational replies
- Avoid these specific words: can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, revolutionize, disruptive, utilize, utilizing, dive deep, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, opened up, powerful, inquiries, ever-evolving

---

## 3. Tech Stack

### Frontend
- React 18 with functional components and hooks
- Vite as the dev server and build tool
- Plain CSS with inline style objects (no Tailwind, no CSS modules)
- Recharts for all data visualization and dashboards
- @react-pdf/renderer for PDF generation
- react-signature-canvas for signature capture (checklist feature)

### Backend
- Supabase (Postgres, Auth, Storage, Edge Functions) for everything server-side
- Edge Functions run on Deno, written in TypeScript
- Edge Functions handle anything needing secrets or server-side execution

### Integrations
- Twilio for two-way SMS
- Anthropic Claude API for AI tenant screening (called only from Edge Functions, never browser, due to CORS)
- Unsplash for property stock photography
- randomuser.me for demo tenant avatars

### Infrastructure
- Vercel for frontend hosting, auto-deploys on push to main
- GitHub for version control
- Custom domains: propli.app (primary), propli.pro (secondary)

### Developer Tools
- Cursor AI as primary IDE
- Claude Code for agentic multi-file work and refactors
- Supabase CLI for Edge Function deployment and migrations

---

## 4. Repository Layout

Local path: `~/Downloads/pm-crm`

```
~/Downloads/pm-crm/
├── src/                          // Frontend source
│   ├── App.jsx                   // Main file, mid-refactor, was 21,333 lines
│   ├── Auth.jsx                  // Auth flow, lives at src root (Phase 10.5 migration)
│   ├── TenantPortal.jsx          // Tenant-facing portal (Phase 10.5 migration)
│   ├── PaymentPage.jsx           // Tenant payment page (Phase 10.5 migration)
│   ├── shared/
│   │   ├── components/           // Extracted UI primitives (Phase 2 done)
│   │   ├── hooks/                // useToast extracted (Phase 2 done)
│   │   ├── styles/
│   │   │   ├── tokens.js         // Design tokens (Phase 1)
│   │   │   └── globals.css       // Global styles (Phase 1)
│   │   └── utils/                // Format helpers (Phase 3 target)
│   ├── features/                 // Feature folders (scaffolded Phase 1)
│   │   ├── tenants/              // Phase 4 target (highest risk)
│   │   ├── properties/           // Phase 5
│   │   ├── maintenance/          // Phase 6
│   │   ├── owners/               // Phase 7
│   │   ├── messages/             // Phase 8
│   │   ├── schedule/             // Phase 9
│   │   ├── reports/              // Phase 9
│   │   ├── applications/         // Phase 9
│   │   ├── settings/             // Phase 9
│   │   ├── dashboard/            // Phase 9
│   │   ├── owner-portal/         // Phase 10
│   │   ├── checklists/           // Phase 10.5 (added during refactor)
│   │   ├── auth/                 // Phase 10.5 (added during refactor)
│   │   ├── tenant-portal/        // Phase 10.5 (added during refactor)
│   │   ├── payments/             // Phase 10.5 (added during refactor)
│   │   └── dev-tools/            // Demo data generators
│   ├── lib/
│   │   └── supabase.js           // Supabase client
│   ├── pages/
│   │   └── Checklists.jsx        // Partially built, will move to features/checklists
│   └── components/
│       └── checklists/           // Partially built, will move to features/checklists
├── supabase/
│   ├── functions/
│   │   ├── twilio-webhook/       // Inbound SMS handler
│   │   ├── send-sms/             // Outbound SMS
│   │   └── screen-tenant/        // AI tenant screening
│   └── migrations/               // Source of truth for schema, trust over docs
├── public/
├── index.html
├── vite.config.js
├── package.json
├── .env                          // Local secrets, gitignored
├── .env.example                  // Documents required env vars
├── CLAUDE.md                     // Permanent project conventions
├── AGENTS.md                     // Operations guide
├── PROPLI-REFACTOR.md            // Active 13-phase refactor plan
├── REFACTOR-PROMPTS.md           // Paste-and-go prompts for each phase
├── REFACTOR-FINDINGS.md          // Issues found during refactor, deferred
└── PROPLI-HANDOVER.md            // This file
```

---

## 5. Common Commands

```bash
# Local development
npm run dev                          # Vite dev server at localhost:5173
npm run build                        # Production build
npm run preview                      # Preview production build locally

# Deployment
git push                             # Auto-deploys frontend to Vercel from main

# Supabase Edge Functions (git push does NOT deploy these)
supabase functions deploy <name>     # Deploy one function
supabase functions deploy            # Deploy all functions
supabase secrets set KEY=value       # Set an Edge Function secret
supabase secrets list                # List secret names (values hidden)
supabase functions logs <name> --tail # Tail logs for one function

# Database
supabase migration new <name>        # Create a new migration file
supabase db push                     # Push migrations to remote
supabase db dump --data-only > backup-$(date +%Y%m%d).sql
```

---

## 6. Required Environment Variables

In `.env` at the repo root (gitignored):

```
VITE_SUPABASE_URL=https://unexucxndxzsqbcqsbyo.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
```

In Vercel project settings, same two vars.

In Supabase Edge Function secrets (set via `supabase secrets set`):

```
ANTHROPIC_API_KEY=sk-ant-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+18884049205
SUPABASE_URL=...                     // Auto-injected
SUPABASE_SERVICE_ROLE_KEY=...        // Auto-injected
```

Security note: a `VITE_ANTHROPIC_API_KEY` variable was present in `.env` and git history at one point. A code scan confirmed it was never referenced in source and never baked into the browser bundle. Key was rotated, new key set as a Supabase Edge Function secret, the orphaned variable removed, and `.env.example` added to document required vars. Anything VITE-prefixed is exposed to the browser bundle. Never put third-party API keys behind a VITE prefix.

---

## 7. Database Schema

Supabase Postgres with Row Level Security on every table.

**Important: When this doc and the actual migration files disagree, trust the migrations.** This section was rewritten against the real schema on 2026-05-16 after Claude Code flagged 7 mismatches during the 500-door demo generator task. The migration files in `supabase/migrations/` are the source of truth.

### Primary tables

**tenants**
- id (UUID), user_id (UUID, FK auth.users)
- name, email, phone (10 digits no formatting, used for SMS matching)
- property, property_id, unit, photo
- status: prospect, current, late, past (lowercase, not Title Case)
- rent_amount, payment_status, lease_start, lease_end
- notes

**properties**
- id (BIGINT), user_id (UUID, FK auth.users)
- name, address, city, state, zip
- type (TEXT, not property_type): Single-family, Multi-family, Townhouse, Duplex
- owner_id (BIGINT)
- rent_amount
- photo
- expenses (JSONB): 12 months of expenses embedded per property, no standalone expenses table

**maintenance_requests**
- id (UUID), user_id (UUID, FK auth.users)
- tenant_id, tenant_name, property
- title (VARCHAR 255), description (TEXT)
- priority: Low, Medium, High, Urgent (auto-set to Urgent on SMS keywords "emergency" or "urgent")
- status: open, in_progress, closed (these are the actual values the UI filters on, not Pending/In Progress/Completed/Scheduled as previously documented)
- source: manual, sms (value 'sms' when auto-created from inbound SMS, written by the Twilio webhook)
- assigned_to (vendor)
- created_at, completed_at

**owners**
- id (UUID), user_id (UUID, FK auth.users)
- name, email, phone, address
- management_fee DECIMAL(5,2) DEFAULT 10
- portal_enabled BOOLEAN
- portal_token VARCHAR(255), auto-generated by DB when portal_enabled is set true
- last_login

**owner_statements**
- id (UUID), owner_id (UUID, FK owners)
- property_id (UUID)
- period_start, period_end DATE
- gross_income, expenses, management_fee, net_distribution DECIMAL(10,2)
- status: draft, sent, paid
- created_at

Latent bug: owner_statements.property_id is declared UUID but properties.id is BIGINT. The FK is broken. owner_statements is effectively unwritable until this is fixed via migration. Logged to REFACTOR-FINDINGS.md.

**tags**
- id (UUID), user_id (UUID)
- name VARCHAR(50), color VARCHAR(20) DEFAULT 'blue'
- UNIQUE(user_id, name)

**record_tags** (polymorphic junction)
- id (UUID), tag_id (UUID, FK tags)
- record_type VARCHAR(20): tenant, property, maintenance, owner
- record_id UUID (the previous handover said TEXT, the migration says UUID)
- added_at, added_by

Schema implication: record_tags only supports UUID-keyed records cleanly. Tagging properties (BIGINT id) requires casting or a workaround. Demo data generators should skip the tags pipeline until this is reconciled.

**files**
- id (UUID), user_id (UUID)
- record_type, record_id, file_path, file_name, file_size, mime_type

**schedule_events**

This table does not exist in the database. The Schedule feature uses React state only via `scheduleEvents` (declared around App.jsx:313). No `.from('schedule_events')` queries exist anywhere in the code. Calendar events do not persist across sessions. Logged to REFACTOR-FINDINGS.md as a real gap to address if Schedule becomes a paid feature.

**expenses**

This table does not exist as a standalone table. Expenses are embedded as JSONB on `properties.expenses`, 12 months per property. The Reports tab reads `p.expenses` directly (around App.jsx:3553). The 35-tenant demo loader uses this pattern (App.jsx:5446 through 5475). Any new expense generation must follow the embedded JSONB pattern.

**payment_requests**
- id, user_id, tenant_id, amount, status, due_date

**sms_messages**
- phone_number, tenant_id, direction (inbound/outbound), message, twilio_sid, status, created_at

**tenant_applications**
- id (UUID), property_id (BIGINT), unit_number
- first_name, last_name, email, phone, date_of_birth, ssn_last_four
- current_address, current_city, current_state, current_zip
- current_rent, current_landlord_name, current_landlord_phone, months_at_current_address
- employer_name, employer_phone, job_title, monthly_income, employment_start_date
- additional_income, additional_income_source
- has_eviction_history, eviction_explanation
- has_criminal_history, criminal_explanation
- has_bankruptcy, bankruptcy_explanation
- desired_move_in, number_of_occupants, has_pets, pet_details
- status: submitted, documents_pending, screening, approved, conditionally_approved, denied
- screening_started_at, screening_completed_at
- decision_made_by, decision_made_at, decision_notes

**screening_results**
- id (UUID), application_id (UUID, FK tenant_applications)
- overall_score, recommendation, risk_level
- analysis (JSONB structured response from Claude API)
- created_at

**inspection_checklists** (in-progress feature)
- id, tenant_id, property_id, unit
- type: move_in, move_out
- status: draft, in_progress, pending_signatures, completed
- inspection_date, signed_by_tenant_at, signed_by_pm_at

**checklist_items**
- id, checklist_id, room, item_name
- condition: Excellent, Good, Fair, Poor, Damaged
- notes, order_index

**checklist_photos**
- id, checklist_item_id, storage_path, uploaded_at

### Storage buckets

- `property-photos` (public)
- `tenant-documents` (private)
- `application-documents` (private)
- `checklist-photos` (public, 5MB max, image/jpeg image/png image/webp)
- `checklist-signatures` (public, same limits)

### Schema gotchas

- `properties.id` is BIGINT not UUID. Any foreign key referencing properties must be BIGINT. This bit the checklist feature initially and the owner_statements table has a latent FK type mismatch.
- `record_tags.record_id` is UUID. Tagging BIGINT-keyed records like properties requires reconciliation.
- `properties.type` uses TEXT values Single-family, Multi-family, Townhouse, Duplex. There is no Condo. Existing UI renders these four.
- Maintenance status values are open, in_progress, closed in the database and UI filters. AGENTS.md previously claimed New, In Progress, On Hold, Completed, Cancelled and the original handover claimed Pending, In Progress, Completed, Scheduled. Both were wrong. Urgent is a priority value not a status.
- Tenant status values are lowercase: prospect, current, late, past. Title Case versions in old docs were wrong.
- Phone numbers in `tenants.phone` are stored as 10 digits, no formatting (no plus sign, no dashes, no spaces). Example: 2065550142. Twilio webhook normalizes inbound numbers to match. Old dashed format like 206-555-0142 in early demo data is a bug.
- Expenses live as JSONB on `properties.expenses`, not in a separate table.
- Schedule events do not persist. React state only.
- `owners.portal_token` is auto-generated by the database when portal_enabled is set true. Do not generate the token manually.
- RLS policies block queries silently if misconfigured. If a query returns empty unexpectedly, check Supabase logs and RLS policies before assuming a bug.
- Not all tables have a `user_id` column. Tables scoped through a parent relationship: `inspection_checklists` (via tenant_id or property_id), `checklist_items` (via checklist_id), `checklist_photos` (via checklist_item_id), `screening_results` (via application_id), `application_documents` (via application_id), `rental_references` (via application_id), `owner_properties` (via owner_id or property_id). `record_tags` uses `added_by`, not `user_id`. Clear functions and demo data loaders must handle these via subquery joins on the parent rather than direct `user_id` filters.

---

## 8. Edge Functions

Three Edge Functions live in `supabase/functions/`:

### twilio-webhook

Path: `supabase/functions/twilio-webhook/index.ts`
URL: `https://unexucxndxzsqbcqsbyo.supabase.co/functions/v1/twilio-webhook`
JWT verification: OFF (Twilio cannot send JWTs)

Flow:
1. Twilio POSTs form data on inbound SMS
2. Function extracts From, Body, MessageSid
3. Normalizes phone (strips +1 and non-digits)
4. Queries tenants table for match on phone
5. Inserts into sms_messages with direction='inbound', tenant_id (or null), twilio_sid, status='delivered'
6. Scans body for maintenance keywords
7. If keyword match AND tenant found, inserts maintenance_requests row with source='sms'
8. Priority set to URGENT if body contains "emergency" or "urgent", otherwise MEDIUM
9. Returns empty TwiML (no auto-reply)

Keywords that trigger maintenance auto-creation: broken, leak, repair, fix, not working, emergency, urgent, ac, heat, water, door, lock

### send-sms

Path: `supabase/functions/send-sms/index.ts`
JWT verification: ON (called from authenticated frontend)

Flow:
1. Frontend posts { to, body, tenant_id }
2. Function calls Twilio Messages API
3. Inserts into sms_messages with direction='outbound', twilio_sid from response

### screen-tenant

Path: `supabase/functions/screen-tenant/index.ts`
JWT verification: OFF (was needed to make initial integration work, see note below)
Model: `claude-sonnet-4-5-20250929`

Flow:
1. Frontend posts { applicationId }
2. Function fetches tenant_applications row
3. Function fetches associated property for rent_amount
4. Calculates income-to-rent ratio
5. Builds prompt for Claude with structured JSON response schema
6. Calls Anthropic Messages API
7. Parses JSON: overall_score, recommendation, risk_level, analysis
8. Inserts into screening_results
9. Updates tenant_applications.status to screening or approved/denied
10. Returns result to frontend

Headers required from frontend:
- Authorization: Bearer <supabase session access_token>
- apikey: VITE_SUPABASE_ANON_KEY

### Common Edge Function issues

- 401 Unauthorized: verify_jwt setting; set to false for external webhook callers like Twilio
- 504 timeout: slow database query or unbounded external API call. The AI Lease Analyzer was killed for this reason.
- CORS errors in browser: function needs `Access-Control-Allow-Origin` headers and a proper OPTIONS handler
- 500 with no log: secret name mismatch, case-sensitive

### Critical: git push does not deploy Edge Functions

Always run `supabase functions deploy <name>` after editing a function. This has caused real confusion in past sessions.

---

## 9. Coding Conventions

### Components
- Functional components only, no classes
- Named exports for all shared components
- Default exports only for route-level page components
- Component files: PascalCase (TenantCard.jsx)
- Hook files: camelCase starting with use (useTenants.js)
- Keep files under 300 lines; split if approaching

### Styling
- Use design tokens from `src/shared/styles/tokens.js` for every color, spacing, radius, shadow
- No hex codes in component files after refactor completes
- Inline style objects for component-specific styling
- Global styles only in `src/shared/styles/globals.css`
- Mobile breakpoint: 768px
- Modals: centered overlay with backdrop
- Detail panels: slide from right
- Primary brand color: #1a73e8

### Design tokens (src/shared/styles/tokens.js)

```js
export const colors = {
  brand: { primary: '#1a73e8', primaryHover: '#1557b0', accent: '#6366f1' },
  status: { success: '#10b981', warning: '#f59e0b', danger: '#ef4444', info: '#3b82f6' },
  neutral: { 50:'#f9fafb', 100:'#f3f4f6', 200:'#e5e7eb', 300:'#d1d5db', 500:'#6b7280', 700:'#374151', 900:'#111827' },
  surface: { background:'#ffffff', subtle:'#f9fafb', border:'#e5e7eb' }
};
export const spacing = { xs:4, sm:8, md:12, lg:16, xl:24, '2xl':32, '3xl':48 };
export const radius = { sm:4, md:8, lg:12, xl:16, full:9999 };
export const shadow = {
  sm:'0 1px 2px rgba(0,0,0,0.05)',
  md:'0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.06)',
  lg:'0 10px 15px rgba(0,0,0,0.1)'
};
export const typography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  sizes: { xs:12, sm:13, base:14, md:15, lg:16, xl:18, '2xl':20, '3xl':24, '4xl':32 },
  weights: { normal:400, medium:500, semibold:600, bold:700 }
};
```

### Supabase usage
- All queries go through feature-level hooks (useTenants, useProperties, etc.)
- Never query Supabase directly from a UI component
- Always handle loading and error states
- Use RLS policies for security, never rely on application-level filtering alone

### State
- Local component state for UI-only concerns (modals, form inputs)
- No Redux, no Zustand, no global state library
- Data fetching handled in feature hooks, re-fetched on mutation

---

## 10. Hard Rules

Never do these without explicit user approval:

1. Add a new npm package
2. Change a database schema, RLS policy, or Edge Function signature
3. Remove a feature, even if it looks unused
4. Change a route path (`/owner-portal` stays `/owner-portal`)
5. Commit secrets, API keys, or tokens to the repo
6. Use localStorage or sessionStorage in artifact contexts
7. Rewrite code from scratch when a refactor would work
8. Deploy to production without local testing first

---

## 11. Implemented Features

### Tenants
- Onboarding wizard (single-family auto-assigns unit, multi-family requires unit number)
- Offboarding wizard
- Lease management (renew, terminate, status tracking)
- Kanban board: color-coded columns for prospect, current, late, past
- List/table view with sort and filter
- Detail panel with tabs

### Properties
- Property creation with Single-family, Multi-family, Townhouse, Duplex types
- Unit tracking on multi-family
- Photo uploads via Supabase Storage
- Property assignment to owners with ownership percentage

### Maintenance
- Manual request creation
- Auto-creation from inbound SMS keywords
- Status workflow: open, in_progress, closed
- Priority: Low, Medium, High, Urgent
- Vendor assignment
- Detail panel shows tenant name and source indicator (SMS icon for auto-created)

### Messages (Two-Way SMS)
- Twilio toll-free number +1 888 404 9205
- Inbound SMS auto-matches tenant by phone
- Conversation view per phone number
- Outbound reply from app
- Unread badge on conversation list
- Refresh button on Messages tab

### Owner Portal
- Route: /owner-portal
- Separate login flow from admin app
- Authenticated via access token generated when admin toggles portal_enabled
- Tabs: Overview, Properties, Tenants, Statements
- Read-only, scoped to that owner's properties
- Revenue calculation: sum of tenant rent on assigned properties times ownership percentage
- Management fee calculation: percentage of collected revenue per agreement

### AI Tenant Screening
- screen-tenant Edge Function calls Claude API
- Application form captures: applicant info, address, employment, income, screening questions, rental preferences
- Documents tab for upload checklist
- Run AI Screening button posts to Edge Function
- Screening Report tab renders parsed result: overall_score, recommendation, risk_level, analysis

### Reports
- Recharts visualizations
- PDF export
- CSV export

### Tenant Portal
- src/TenantPortal.jsx (Phase 10.5 migration target)
- Tenants can view their lease, pay rent, submit maintenance requests

### Payments
- src/PaymentPage.jsx (Phase 10.5 migration target)
- Payment request links sent to tenants

### Schedule
- Calendar widget
- Event creation (React state only, does not persist across sessions)

### Tagging
- Polymorphic tagging across tenants, properties, maintenance, owners
- Color-coded tags
- Per-user tag library
- Note: record_tags.record_id is UUID, so tagging properties (BIGINT id) is currently broken

### File uploads
- Photos and documents via Supabase Storage
- Linked to records by record_type + record_id

### Demo data
- Pacific Northwest scenario: 8 properties, 35 tenants, 20 maintenance requests, 12 months of payment/expense history
- Realistic scenarios: late payments, prospects, completed maintenance, varied lease dates
- Loaded via dev-only loader visible only to strongsa@uw.edu in Settings > Developer Tools
- Actions: Load Demo Data, Clear All Data (double confirmation required)
- 500-door portfolio generator: in progress (2026-05-16)

### Vendors
- Vendor directory
- Vendor payments tracking
- Vendor assignment to maintenance requests

### Late Fees
- Late fees tracking (basic, not automated)

---

## 12. Features Attempted and Removed

### AI Lease Analyzer
- Removed due to persistent Supabase Edge Function timeouts on large PDFs
- May revisit later with a streaming or background job pattern
- Delete the analyze-lease Edge Function in Supabase if it still exists

---

## 13. Features Planned

In rough priority order:

1. Finish move-in/move-out checklist (schema and storage exist, React components not built)
2. Scale demo data to 500 records for upcoming operator demo (in progress)
3. Automated Late Fees (rules engine: "$50 after 5 days late" auto-applies)
4. Owner statement generation (partially scaffolded, blocked on FK type mismatch fix)
5. Document storage per tenant and property
6. Automated rent reminders (SMS or email before due date)

Explicitly deferred:
- Stripe payment processing
- Google Calendar / Outlook integration
- Native mobile apps
- AI Lease Analyzer (removed; revisit later)

---

## 14. Active Refactor (PROPLI-REFACTOR.md)

Branch: `refactor/structural-split`

The original `src/App.jsx` reached 21,333 lines from incremental AI-assisted feature additions. The refactor splits it into a feature-folder architecture without changing any behavior or schema.

### Refactor phases

- Phase 0: Baseline and safety, DONE. 21,333-line App.jsx, 1,688 kB bundle captured.
- Phase 1: Folder scaffolding and design tokens, DONE.
- Phase 2: Extract shared UI primitives and useToast hook, DONE. Seven primitives, surgical edit to App.jsx (lines 307 and 5761-5768), bundle grew 0.16 kB. Verified via green success toast on Messages refresh.
- Phase 3: Extract Supabase client and utilities, QUEUED.
- Phase 4: Extract tenant feature, RESERVED for a fresh session. Highest risk. Budget 2 to 3 hours. Sub-steps 4.1 through 4.10, one commit each.
- Phase 5: Properties
- Phase 6: Maintenance
- Phase 7: Owners
- Phase 8: Messages
- Phase 9: Schedule, Reports, Applications, Settings, Dashboard
- Phase 10: Owner Portal
- Phase 10.5 (added during refactor): Checklists, Auth, Tenant Portal, Payments
- Phase 11: Slim down App.jsx
- Phase 12: Cleanup
- Phase 13: Merge to main and smoke test

### Refactor rules

- Do not skip phases
- After each phase: run dev server, click through affected feature, commit before moving on
- If anything breaks: revert the commit, flag the issue, do not paste the next prompt
- Test in browser at localhost:5173 between every phase
- Zero new features in this refactor
- Zero schema or RLS changes
- Zero route renames

### Time budget

- Phases 0 through 3: about 30 minutes total
- Phase 4: 2 to 3 hours, do when fresh, not at end of day
- Phases 5 through 9: 20 to 45 minutes each
- Phase 10: about 30 minutes
- Phases 11 and 12: 30 to 45 minutes combined
- Phase 13: 15 minutes
- Total: one weekend if clean, two weekends if not

---

## 15. Known Issues Logged to REFACTOR-FINDINGS.md

Deferred to post-refactor cleanup. Do not fix inline during refactor.

1. `dist/` folder was tracked in git, needs gitignoring
2. `Auth.jsx`, `TenantPortal.jsx`, `PaymentPage.jsx` live at src/ root without feature folders (handled in Phase 10.5)
3. `src/pages/Checklists.jsx` and `src/components/checklists/` exist as partially-built code not in the original refactor plan (handled in Phase 10.5)
4. Toast uses pastel status colors (#fee2e2, #d1fae5, #e0f2fe) not present in tokens.js
5. `Date.now()` used for toast IDs, theoretical collision risk
6. Tenant add and update handlers use `alert()` or silent failure instead of `showToast()`, inconsistent with other flows
7. owner_statements.property_id declared UUID but properties.id is BIGINT. FK is broken. Table is unwritable until migration fixes the type. Blocks owner statement generation feature.
8. record_tags.record_id declared UUID. Cannot tag BIGINT-keyed records like properties without casting. Tags feature partially broken.
9. schedule_events table does not exist. Schedule feature uses React state only, events do not persist. Real gap to address if Schedule becomes a paid feature.

When you notice something weird during a refactor phase, write it down in REFACTOR-FINDINGS.md. Do not fix it inline. Work through the list methodically after the refactor ships.

---

## 16. Deployment Flow

1. Work on a feature branch for anything non-trivial
2. Test locally with `npm run dev`
3. Build locally with `npm run build` to catch build errors
4. Push to branch, open PR, self-review the diff
5. Merge to main
6. Vercel auto-deploys within 2 minutes
7. Smoke test propli.app after deploy
8. If Edge Function changed: `supabase functions deploy <name>` explicitly

---

## 17. Pre-Demo Checklist

Before any user demo with a prospect:

1. Clear demo data, reload fresh so dates and "days late" render correctly
2. Confirm Twilio number is active, send yourself a test SMS
3. Smoke test the owner portal with a test owner login
4. Check Vercel for any failed deploys in the last 24 hours
5. Check Supabase Edge Function logs for recent errors
6. Load propli.app on both desktop and phone, confirm both render

---

## 18. Adding a New Feature

1. Create `src/features/<feature-name>/`
2. Create `use<Feature>.js` hook for all Supabase queries
3. Create page component `<Feature>Page.jsx` with default export
4. Create sub-components as needed, named exports
5. Add the route in App.jsx
6. Add nav item to the sidebar
7. Test manually against the Universal Smoke Test
8. Document the feature in AGENTS.md under Feature Specifications
9. Commit with `feat: add <feature-name>`

---

## 19. Known Gotchas

- `src/App.jsx` is mid-refactor. New work touches feature folders, not App.jsx.
- Edge Function deploys need explicit `supabase functions deploy <name>`. Git push does not deploy them.
- Twilio toll-free numbers need verification before production SMS volume works reliably.
- Owner portal lives at `/owner-portal` with its own login flow separate from the admin app.
- Demo data loader visible only to strongsa@uw.edu in Settings > Developer Tools.
- RLS policies block queries silently if misconfigured. Check Supabase logs when a query returns empty.
- Direct browser API calls to third-party APIs (like Anthropic) fail on CORS. Route through Edge Functions.
- `.env` cleanup commits have wiped Supabase credentials before. Always grep `.env` before committing.
- VITE-prefixed env vars are exposed to the browser bundle. Never put third-party API keys behind VITE.
- `properties.id` is BIGINT. Foreign keys to it must be BIGINT.
- Twilio webhook needs JWT verification turned OFF in Supabase function settings.
- Inbound SMS only auto-creates maintenance if the tenant phone matches AND a keyword is present. Test tenants must have your phone number set as 10 digits no formatting.
- When this doc and the migration files disagree, trust the migrations. Section 7 was wrong on 7 points before 2026-05-16.

---

## 20. Support and Escalation

When a feature breaks in production:

1. Check Vercel deploy log for recent errors
2. Check Supabase dashboard for database errors
3. Check Edge Function logs (`supabase functions logs <name> --tail`)
4. Check browser console on propli.app
5. If unclear, revert to last known good commit: `git revert <sha>` and push
6. Log the issue for proper fixing later

When the Anthropic API has an incident (affects Claude Code and Cursor):

1. Check status.claude.com for active incidents
2. Subscribe to status updates instead of mashing the retry button
3. If down for more than 30 minutes, switch to manual work that doesn't need the API (doc updates, browser testing, planning)

---

## 21. How to Bootstrap a New Project Session

Drop this file into the new Claude project's project knowledge. Then open the new conversation with:

```
I'm continuing development on Propli. Read PROPLI-HANDOVER.md first.
Tell me back in 5 bullets what you now know about Propli, the stack,
the active refactor state, and any current priorities. Do not start
coding yet. Ask me what we're working on.
```

If the 5-bullet summary captures the project correctly, you're ready to work. If anything is missing or contradictory, update this file before continuing.

For Claude Code in the repo, also keep these files in the repo root so they get auto-read:

- `CLAUDE.md`, permanent project conventions and hard rules
- `AGENTS.md`, operations guide and feature specs
- `PROPLI-REFACTOR.md`, active refactor spec (delete when refactor ships)
- `REFACTOR-PROMPTS.md`, paste-and-go prompts for each refactor phase
- `REFACTOR-FINDINGS.md`, running log of deferred issues
- `PROPLI-HANDOVER.md`, this file (the master context for new sessions)

---

## 22. Quick Reference Card

| Thing | Value |
|---|---|
| Repo path | `~/Downloads/pm-crm` |
| Primary domain | propli.app |
| Secondary domain | propli.pro |
| Supabase project URL | https://unexucxndxzsqbcqsbyo.supabase.co |
| Twilio number | +1 888 404 9205 (toll-free) |
| Twilio webhook | https://unexucxndxzsqbcqsbyo.supabase.co/functions/v1/twilio-webhook |
| Claude model | claude-sonnet-4-5-20250929 |
| Dev server port | localhost:5173 |
| Dev-only admin email | strongsa@uw.edu |
| Mobile breakpoint | 768px |
| Brand primary | #1a73e8 |
| Active branch | refactor/structural-split |
| App.jsx baseline | 21,333 lines |
| Bundle baseline | 1,688 kB |
| Schema source of truth | `supabase/migrations/` (not this doc) |
