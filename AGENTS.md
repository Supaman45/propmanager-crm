# AGENTS.md

Operational guide for any AI coding agent working on Propli. Pairs with CLAUDE.md (conventions and rules). This file covers how to do things, not what things are.

## Setup

\# Clone

git clone git@github.com:\<owner\>/pm-crm.git

cd pm-crm

\# Install

npm install

\# Environment

cp .env.example .env

\# Fill in:

\#   VITE\_SUPABASE\_URL=

\#   VITE\_SUPABASE\_ANON\_KEY=

\# Run

npm run dev

\# Opens at http://localhost:5173

For Supabase CLI operations:

\# Install Supabase CLI (macOS)

brew install supabase/tap/supabase

\# Link to project

supabase link \--project-ref \<project-ref\>

\# Confirm connection

supabase status

## Dev Workflow

1. Pull latest from `main` before starting.  
2. Create a feature branch: `git checkout -b feat/<short-name>` or `refactor/<short-name>` or `fix/<short-name>`.  
3. Run `npm run dev` in one terminal.  
4. Make changes, test in browser, check the console.  
5. Run `npm run build` before committing to catch build errors.  
6. Commit with conventional format: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.  
7. Push branch, open PR.  
8. Self-review diff, merge to `main`.  
9. Watch Vercel deploy log for errors.  
10. Smoke test propli.app.

## Testing Protocols

Manual testing only for now. No unit or integration test suite yet.

### Universal Smoke Test

Run after any deploy or major change:

1. Load propli.app, sign in as admin  
2. Dashboard renders with current numbers  
3. Tenants page loads, kanban shows all tenants  
4. Click a tenant, detail panel opens  
5. Properties page loads with cards  
6. Maintenance page loads with requests  
7. Messages page loads, conversations render  
8. Owner portal at propli.app/owner-portal loads login page  
9. Sign in as a test owner, dashboard renders  
10. Mobile view at 375px width looks right

### Feature-Specific Tests

See individual feature specs below.

## Feature Specifications

### Tenants

Core feature. Status values: Prospect, Current, Late, Past.

Key flows:

- Onboarding wizard (multi-step): property selection, unit assignment (auto-assign for single-family), lease terms, documents  
- Offboarding wizard: move-out date, deposit return, final statement  
- Status transitions: Prospect to Current (signed lease), Current to Late (rent overdue), Current to Past (moved out)  
- Payment recording updates status from Late back to Current  
- Kanban and list views, filterable by property and status

Test:

- Create a prospect, move through onboarding, verify tenant appears as Current  
- Record a payment on a Late tenant, verify status changes to Current  
- Run offboarding, verify tenant appears in Past column  
- Edit phone number, verify it saves in 10-digit format (no formatting) for Twilio matching

### Properties

Property types: single\_family, multi\_family, condo, townhouse.

Key behavior:

- Single-family properties auto-assign units during tenant onboarding  
- Multi-family properties require explicit unit selection from available units  
- Monthly revenue calculated from active tenant rents  
- Occupancy rate calculated from occupied units over total units

Test:

- Add a single-family property, onboard a tenant, confirm no unit prompt appears  
- Add a multi-family with 4 units, onboard 2 tenants, confirm only available units show in wizard

### Maintenance

Request statuses: New, In Progress, On Hold, Completed, Cancelled.

Priority levels: Low, Medium, High, Urgent.

Auto-creation source: inbound SMS (source='sms') when keywords match.

Keywords trigger auto-creation: broken, leak, repair, fix, not working, emergency, urgent, ac, heat, water, door, lock.

Test:

- Create a manual request, verify it renders in the list with correct priority  
- Send a test SMS from a phone number matching a tenant, containing "my AC is broken"  
- Verify the SMS appears in Messages tab  
- Verify a maintenance request auto-creates with source='sms'  
- Update status through the detail panel  
- Assign a vendor

### Owners

Key flows:

- Assign property to owner with ownership percentage (supports split ownership)  
- Generate owner statement for a date range  
- Toggle portal access (creates an access token)

Owner revenue calculation: sum of tenant rent on assigned properties times ownership percentage for the period.

Management fee calculation: percentage of collected revenue per owner agreement.

Test:

- Create an owner, assign two properties at 50 percent each  
- Generate a statement for last 30 days, verify math  
- Toggle portal access on, sign in to propli.app/owner-portal as that owner

### Messages (Two-Way SMS)

Twilio webhook URL: `https://<project>.supabase.co/functions/v1/twilio-webhook`

Inbound flow:

1. Tenant texts Twilio number  
2. Twilio POSTs to Edge Function  
3. Function logs to `sms_messages` table  
4. Function attempts tenant match on phone (10-digit, no formatting)  
5. Function scans message body for keywords  
6. If match and keywords, creates `maintenance_requests` row with source='sms'

Outbound flow:

1. Admin types in conversation view, clicks Send  
2. Frontend calls `send-sms` Edge Function  
3. Edge Function calls Twilio API, logs to `sms_messages`

Test:

- Set a test tenant's phone to your number (10 digits, no \+1)  
- Text the Twilio number: "Test message"  
- Verify it appears in Messages within 5 seconds  
- Reply from the conversation view  
- Verify reply arrives on your phone  
- Text "my sink is leaking", verify maintenance auto-creates

### Applications and AI Tenant Screening

Edge Function: `screen-tenant`

Model: `claude-sonnet-4-5-20250929`

Flow:

1. Applicant fills form, uploads documents  
2. Admin clicks Run AI Screening  
3. Frontend calls `screen-tenant` Edge Function  
4. Function fetches application data and documents  
5. Function builds a prompt with income-to-rent ratio, rental history, employment  
6. Function calls Claude API  
7. Function parses structured JSON response (overall\_score, recommendation, risk\_level, analysis)  
8. Function updates application status and writes screening\_results row

Test:

- Create a test application with realistic data  
- Run screening  
- Confirm report renders in the Screening Report tab  
- If errors: check Supabase Edge Function logs, verify `ANTHROPIC_API_KEY` secret is set, verify model name matches the code

### Owner Portal

Route: `/owner-portal`

Separate login flow from admin app. Authenticated via access token generated when admin toggles portal access on the owner record.

Tabs: Overview, Properties, Tenants, Statements.

Test:

- From admin, toggle portal access on for a test owner  
- Open propli.app/owner-portal in an incognito window  
- Sign in with owner credentials  
- Verify each tab loads with the correct scoped data (only that owner's properties)

### Move-in/Move-out Checklist (IN PROGRESS)

Status: database schema created, storage buckets created, React components not yet built.

Tables:

- `inspection_checklists` (id, tenant\_id, property\_id, unit, type, status, inspection\_date, signed\_by\_tenant\_at, signed\_by\_pm\_at)  
- `checklist_items` (id, checklist\_id, room, item\_name, condition, notes, order\_index)  
- `checklist_photos` (id, checklist\_item\_id, storage\_path, uploaded\_at)

Type values: move\_in, move\_out.

Status values: draft, in\_progress, pending\_signatures, completed.

Storage buckets:

- `checklist-photos` (public, 5MB max, image/jpeg image/png image/webp)  
- `checklist-signatures` (public, same limits)

Components to build in this order:

1. ChecklistItemRow  
2. RoomSection  
3. PhotoUploader (compresses client-side before upload)  
4. SignatureCapture (react-signature-canvas)  
5. ChecklistForm  
6. ChecklistDetail  
7. ChecklistCard  
8. ChecklistList  
9. ComparisonView (move-in vs move-out side by side)  
10. ChecklistPDF (@react-pdf/renderer)  
11. ChecklistsPage (route component)

Default template rooms: Living Room, Kitchen, Dining Room, Bedroom 1, Bedroom 2, Bathroom 1, Bathroom 2, Laundry, Garage, Exterior.

Default condition values: Excellent, Good, Fair, Poor, Damaged.

Requires these npm packages:

- `react-signature-canvas` for signature capture  
- `@react-pdf/renderer` for PDF generation

Test (after implementation):

- Create move-in checklist for a new tenant  
- Add items across each room with photos and conditions  
- Capture tenant signature  
- Capture PM signature  
- Generate PDF  
- Later, create move-out checklist linked to same tenant  
- Open comparison view, verify side-by-side renders

## Edge Function Operations

### Deploying

\# Deploy a single function

supabase functions deploy twilio-webhook

supabase functions deploy send-sms

supabase functions deploy screen-tenant

\# Deploy all functions

supabase functions deploy

Important: `git push` does not deploy Edge Functions. Run the command above explicitly.

### Setting Secrets

supabase secrets set ANTHROPIC\_API\_KEY=sk-ant-xxxxx

supabase secrets set TWILIO\_ACCOUNT\_SID=ACxxxxx

supabase secrets set TWILIO\_AUTH\_TOKEN=xxxxx

supabase secrets set TWILIO\_PHONE\_NUMBER=+18884049205

List current secrets (values not shown):

supabase secrets list

### Viewing Logs

supabase functions logs twilio-webhook \--tail

Or in the Supabase dashboard under Edge Functions, select the function, click Logs.

### Common Issues

- 401 Unauthorized from a function: check the `verify_jwt` setting in function config, set to false for webhooks called by external services like Twilio.  
- 504 timeout: function took too long, check for slow database queries or external API calls without timeouts.  
- CORS errors in browser: function needs to return proper `Access-Control-Allow-Origin` headers.  
- 500 with no log: secret name mismatch, verify exact case-sensitive name.

## Database Operations

### Running Migrations

\# Create a new migration file

supabase migration new \<name\>

\# Apply locally (if running local Supabase)

supabase db reset

\# Push to remote

supabase db push

For small schema tweaks during development, run SQL directly in the Supabase SQL editor. For anything touching production data or RLS policies, use a migration file so the change is version controlled.

### Backing Up Before Destructive Changes

supabase db dump \--data-only \> backup-$(date \+%Y%m%d).sql

## Adding a New Feature

1. Create a folder in `src/features/<feature-name>/`  
2. Create a `use<Feature>.js` hook for all Supabase queries  
3. Create the page component `<Feature>Page.jsx` with default export  
4. Create sub-components as needed, named exports  
5. Add the route to `App.jsx`  
6. Add a nav item to the sidebar  
7. Test manually against the Universal Smoke Test  
8. Document the feature in this file under Feature Specifications  
9. Commit with `feat: add <feature-name>`

## Loading Demo Data

Demo data loader is visible only to `strongsa@uw.edu` in the Developer Tools section of Settings.

Actions available:

- Load demo data (populates 8 properties, 35 tenants, 20 maintenance requests, 12 months of payments)  
- Clear demo data (removes all records)  
- Scale demo data to 500 records (planned, not yet built)

## Pre-Demo Checklist

Before any user demo with a prospect:

1. Clear demo data, reload fresh so dates and "days late" render correctly  
2. Confirm Twilio number is active, send yourself a test SMS  
3. Smoke test the owner portal with a test owner login  
4. Check Vercel for any failed deploys in the last 24 hours  
5. Check Supabase Edge Function logs for recent errors  
6. Load propli.app on both desktop and phone, confirm both render

## Support and Escalation

When a feature breaks in production:

1. Check Vercel deploy log for recent errors  
2. Check Supabase dashboard for database errors  
3. Check Edge Function logs for function errors  
4. Check browser console on propli.app  
5. If unclear, revert to last known good commit: `git revert <commit-sha>` and push  
6. Log the issue for proper fixing later

## Historical Context

Features built and shipped:

- Tenant management (kanban, list, onboarding, offboarding)  
- Property portfolio tracking  
- Maintenance requests with status workflow  
- Owner management with statements  
- Two-way SMS via Twilio with auto-maintenance creation  
- Owner portal with separate authentication  
- AI tenant screening via Edge Function  
- Demo data loader (dev only)

Features attempted and removed:

- AI Lease Analyzer (removed due to persistent Edge Function timeouts, may revisit with streaming or background job pattern)

Features planned:

- Move-in/move-out checklist (in progress)  
- Scale demo data to 500 records  
- Vendor directory and vendor payments  
- Late fee automation  
- Document storage per tenant and property  
- Automated rent reminders

