# Propli Refactor Prompts

Copy each prompt into Claude Code one at a time. Wait for Claude Code to finish and commit before pasting the next one. Test the app in your browser between every prompt.

If anything breaks, do not paste the next prompt. Revert with `git reset --hard HEAD~1` and flag the issue.

---

## Before You Start

Open a terminal in `~/Downloads/pm-crm` and run Claude Code. In a separate terminal tab, run `npm run dev` and leave it running the entire time.

Paste this first as a warm-up:

Read CLAUDE.md, AGENTS.md, and PROPLI-REFACTOR.md in this repo. Summarize in 5 bullets what Propli is, what stack it uses, and what the refactor goal is. Do not write any code yet. If anything in those docs is unclear or contradictory, ask me before proceeding.

If the summary looks right, continue. If not, update the docs first.

---

## Phase 0: Baseline and Safety

Execute Phase 0 of PROPLI-REFACTOR.md.

Specifically:

1\. Run \`npm run dev\` and confirm it starts cleanly. Report back any errors.

2\. Run \`npm run build\` and confirm it succeeds. Report back the bundle size.

3\. Create a new branch named \`refactor/structural-split\`.

4\. Record the current line count of \`src/App.jsx\` in a comment at the top of PROPLI-REFACTOR.md under a new section called "Baseline Metrics".

5\. Commit with message: \`chore: start structural refactor, baseline captured\`

Stop after the commit. Do not proceed to Phase 1\. Summarize what you did.

---

## Phase 1: Folder Scaffolding and Design Tokens

Execute Phase 1 of PROPLI-REFACTOR.md.

Specifically:

1\. Create the full folder structure under \`src/\` as specified in the plan, using empty \`.gitkeep\` files where needed.

2\. Create \`src/shared/styles/tokens.js\` with the exact design tokens from the plan.

3\. Create \`src/shared/styles/globals.css\`. If \`src/index.css\` exists, move its contents into \`globals.css\` without changing any values, then import \`globals.css\` wherever \`index.css\` was imported.

4\. Do not touch \`src/App.jsx\` in this phase.

Test:

\- Run \`npm run dev\` and confirm the app still loads and looks identical.

\- Run \`npm run build\` and confirm it succeeds.

Commit with message: \`refactor: scaffold folder structure and design tokens\`

Stop after the commit. Do not proceed to Phase 2\. Summarize what you did and any concerns.

---

## Phase 2: Extract Shared UI Primitives

Execute Phase 2 of PROPLI-REFACTOR.md.

Audit \`src/App.jsx\` for these recurring UI patterns and extract them one at a time into \`src/shared/components/\`:

1\. Button (any styled button appearing more than twice)

2\. Modal (centered overlay with backdrop)

3\. Toast notification

4\. Input (with label and error state)

5\. Select or Dropdown

6\. Card container

7\. EmptyState

8\. LoadingSpinner

For each primitive:

\- Create the component file using tokens from \`src/shared/styles/tokens.js\`

\- Use named exports

\- Replace every inline instance in App.jsx with an import from the new component

\- Preserve every style value exactly. No visual changes.

\- Test in browser after each extraction before moving to the next

After all primitives are extracted, run \`npm run build\` and confirm success.

Commit with message: \`refactor: extract shared UI primitives to src/shared/components\`

Stop after the commit. Do not proceed to Phase 3\. Report the new line count of App.jsx and any primitives you chose not to extract with reasoning.

---

## Phase 3: Extract Supabase Client and Utilities

Execute Phase 3 of PROPLI-REFACTOR.md.

Specifically:

1\. If the Supabase client is initialized inside \`src/App.jsx\` or anywhere other than \`src/lib/supabase.js\`, move it to \`src/lib/supabase.js\` and update all imports.

2\. Extract format helpers from App.jsx into individual files under \`src/shared/utils/\`:

   \- \`formatCurrency.js\`

   \- \`formatDate.js\`

   \- \`phoneFormatter.js\`

   \- Any other reusable formatter you find (one per file)

3\. Replace every inline usage in App.jsx with imports from the new utility files.

Test:

\- Run \`npm run dev\` and verify dates, currency, and phone numbers render correctly on tenants, properties, and maintenance pages.

\- Run \`npm run build\`.

Commit with message: \`refactor: centralize supabase client and shared utils\`

Stop after the commit. Do not proceed to Phase 4\. Summarize what you extracted.

---

## Phase 4: Extract Tenant Feature (HIGH RISK)

This is the biggest and riskiest phase. Do not run this at the end of the day.

Execute Phase 4 of PROPLI-REFACTOR.md. This is the tenant feature extraction, the riskiest phase. Go slowly and test after every sub-step.

Extract tenant logic from \`src/App.jsx\` into \`src/features/tenants/\` in this exact order. Commit after each sub-step with the specified message.

Sub-step 4.1: Create \`useTenants.js\`

\- Move every Supabase query touching the \`tenants\` table into \`src/features/tenants/useTenants.js\`

\- Export: \`useTenants()\`, \`useTenant(id)\`, \`createTenant()\`, \`updateTenant()\`, \`deleteTenant()\`, and any other tenant-specific query

\- Keep App.jsx calling these through imports

\- Test: tenants page still loads and lists all tenants

\- Commit: \`refactor(tenants): extract Supabase queries to useTenants hook\`

Sub-step 4.2: Create \`TenantCard.jsx\`

\- Move the tenant card render logic into a new file

\- Replace inline usage in App.jsx

\- Test: kanban and list views still render identical cards

\- Commit: \`refactor(tenants): extract TenantCard component\`

Sub-step 4.3: Create \`TenantKanban.jsx\`

\- Move the kanban board into its own component

\- Import TenantCard

\- Test: all four status columns render, drag/drop (if present) still works

\- Commit: \`refactor(tenants): extract TenantKanban component\`

Sub-step 4.4: Create \`TenantList.jsx\`

\- Move the list/table view into its own component

\- Test: sorting and filtering still work

\- Commit: \`refactor(tenants): extract TenantList component\`

Sub-step 4.5: Create \`TenantDetail.jsx\`

\- Move the detail panel into its own component

\- Test: clicking a tenant opens the panel with all data populated

\- Commit: \`refactor(tenants): extract TenantDetail component\`

Sub-step 4.6: Create \`TenantForm.jsx\`

\- Move the add/edit form into its own component

\- Test: creating and editing a tenant still saves correctly

\- Commit: \`refactor(tenants): extract TenantForm component\`

Sub-step 4.7: Create \`OnboardingWizard.jsx\`

\- Move the onboarding wizard into its own component

\- Test: full onboarding flow end-to-end with a single-family property, then a multi-family property

\- Commit: \`refactor(tenants): extract OnboardingWizard component\`

Sub-step 4.8: Create \`OffboardingWizard.jsx\`

\- Move the offboarding wizard into its own component

\- Test: full offboarding flow end-to-end

\- Commit: \`refactor(tenants): extract OffboardingWizard component\`

Sub-step 4.9: Create \`TenantsPage.jsx\`

\- This is the route component. It owns the kanban/list view switching.

\- Import TenantKanban, TenantList, TenantDetail, TenantForm, OnboardingWizard, OffboardingWizard, useTenants

\- Replace the entire Tenants section in App.jsx with \`\<TenantsPage /\>\`

\- Test the full tenant workflow:

  \- Load tenants page

  \- Switch kanban/list

  \- Open a detail

  \- Edit and save

  \- Run onboarding

  \- Run offboarding

  \- Record a payment to flip Late to Current

  \- Verify search and filters

  \- Test at 375px mobile width

\- Commit: \`refactor(tenants): extract TenantsPage as route component\`

After all sub-steps complete, run \`npm run build\` and confirm success.

Stop after Sub-step 4.9. Do not proceed to Phase 5\. Report the new line count of App.jsx and any issues you had to solve.

---

## Phase 5: Extract Properties Feature

Execute Phase 5 of PROPLI-REFACTOR.md.

Extract the properties feature from \`src/App.jsx\` into \`src/features/properties/\` following the same pattern used for tenants. Files to create:

\- \`useProperties.js\` (all Supabase queries touching \`properties\`)

\- \`PropertyCard.jsx\`

\- \`PropertyDetail.jsx\`

\- \`PropertyForm.jsx\`

\- \`PropertiesPage.jsx\`

Replace the Properties section in App.jsx with \`\<PropertiesPage /\>\`.

Test:

\- Properties page loads with all cards

\- Add a new property (single-family)

\- Add a new property (multi-family with 4 units)

\- Edit a property

\- Open property detail, verify linked tenants show

\- Verify occupancy rate math is correct

Commit with message: \`refactor: extract properties feature\`

Stop after the commit. Do not proceed to Phase 6\. Summarize and report the new App.jsx line count.

---

## Phase 6: Extract Maintenance Feature

Execute Phase 6 of PROPLI-REFACTOR.md.

Extract the maintenance feature from \`src/App.jsx\` into \`src/features/maintenance/\`. Files to create:

\- \`useMaintenance.js\`

\- \`MaintenanceCard.jsx\`

\- \`MaintenanceDetail.jsx\`

\- \`MaintenanceForm.jsx\`

\- \`MaintenancePage.jsx\`

Replace the Maintenance section in App.jsx with \`\<MaintenancePage /\>\`.

Test:

\- Maintenance page loads all requests

\- Create a manual request

\- Update a request status

\- Assign a vendor

\- CRITICAL: send a test SMS to your Twilio number from a phone matching a test tenant, containing "my AC is broken", and verify a maintenance request auto-creates with source='sms'. This tests that the Twilio webhook still integrates correctly with the refactored code.

Commit with message: \`refactor: extract maintenance feature\`

Stop after the commit. Do not proceed to Phase 7\.

---

## Phase 7: Extract Owners Feature

Execute Phase 7 of PROPLI-REFACTOR.md.

Extract the owners feature from \`src/App.jsx\` into \`src/features/owners/\`. Files to create:

\- \`useOwners.js\`

\- \`OwnerDetail.jsx\`

\- \`OwnerForm.jsx\`

\- \`OwnerStatementGenerator.jsx\`

\- \`OwnersPage.jsx\`

Replace the Owners section in App.jsx with \`\<OwnersPage /\>\`.

Test:

\- Owners page loads

\- Create an owner

\- Assign a property to the owner at 50 percent ownership

\- Assign a second property at 100 percent

\- Generate an owner statement for the last 30 days

\- Verify revenue math: 50 percent of property A rent plus 100 percent of property B rent

\- Toggle portal access on

Commit with message: \`refactor: extract owners feature\`

Stop after the commit. Do not proceed to Phase 8\.

---

## Phase 8: Extract Messages (SMS) Feature

Execute Phase 8 of PROPLI-REFACTOR.md.

Extract the messages feature from \`src/App.jsx\` into \`src/features/messages/\`. Files to create:

\- \`useMessages.js\`

\- \`ConversationList.jsx\`

\- \`ConversationView.jsx\`

\- \`MessagesPage.jsx\`

Replace the Messages section in App.jsx with \`\<MessagesPage /\>\`.

Test:

\- Messages page loads with existing conversations

\- Unread badges render correctly

\- Click a conversation, full thread renders

\- Type and send an outbound SMS

\- Verify it arrives on the phone

\- Send an inbound SMS from the phone, verify it appears in the conversation view within 5 seconds

Commit with message: \`refactor: extract messages feature\`

Stop after the commit. Do not proceed to Phase 9\.

---

## Phase 9: Extract Schedule, Reports, Applications, Settings, Dashboard

Execute Phase 9 of PROPLI-REFACTOR.md.

Extract these five features in this order, committing after each one:

Feature 9.1: Schedule

\- \`src/features/schedule/useSchedule.js\`

\- \`src/features/schedule/SchedulePage.jsx\`

\- Test: calendar renders, events show, move-ins and move-outs appear

\- Commit: \`refactor: extract schedule feature\`

Feature 9.2: Reports

\- \`src/features/reports/useReports.js\`

\- \`src/features/reports/ReportsPage.jsx\`

\- Test: all Recharts render with correct data

\- Commit: \`refactor: extract reports feature\`

Feature 9.3: Applications (includes AI tenant screening)

\- \`src/features/applications/useApplications.js\`

\- \`src/features/applications/ApplicationDetail.jsx\`

\- \`src/features/applications/ScreeningReport.jsx\`

\- \`src/features/applications/ApplicationsPage.jsx\`

\- Test: applications list renders, create a test application, run AI screening, verify the Edge Function is called correctly and the report renders

\- Commit: \`refactor: extract applications feature\`

Feature 9.4: Settings

\- \`src/features/settings/useSettings.js\`

\- \`src/features/settings/SettingsPage.jsx\`

\- Test: all settings tabs render, developer tools still show only for strongsa@uw.edu

\- Commit: \`refactor: extract settings feature\`

Feature 9.5: Dashboard

\- \`src/features/dashboard/DashboardPage.jsx\`

\- Test: dashboard numbers match reality, greeting renders

\- Commit: \`refactor: extract dashboard feature\`

Stop after Feature 9.5. Do not proceed to Phase 10\. Report the new App.jsx line count.

---

## Phase 10: Extract Owner Portal

Execute Phase 10 of PROPLI-REFACTOR.md.

The owner portal at \`/owner-portal\` is effectively a second app. Extract into \`src/features/owner-portal/\`:

\- \`OwnerPortalApp.jsx\` (sub-router for the portal)

\- \`OwnerLogin.jsx\`

\- \`OwnerDashboard.jsx\` (wraps the four tabs)

\- Any other owner-portal-specific components

Update the top-level router in \`src/App.jsx\` so \`/owner-portal/\*\` routes to \`OwnerPortalApp\`.

Test:

\- Open propli.app/owner-portal in an incognito window

\- Sign in with a test owner

\- Verify Overview tab shows correct stats

\- Verify Properties tab scopes to only this owner's properties

\- Verify Tenants tab scopes correctly

\- Verify Statements tab shows distribution history

\- Sign out, sign back in

Commit with message: \`refactor: extract owner portal\`

Stop after the commit. Do not proceed to Phase 11\.

---

## Phase 11: Slim Down App.jsx

Execute Phase 11 of PROPLI-REFACTOR.md.

\`src/App.jsx\` should now be a thin shell. Reduce it to:

\- Imports for the router and each feature page

\- The main admin layout (sidebar, top bar, content area)

\- The route table that maps paths to feature pages

\- The owner portal sub-route

Target: under 100 lines.

Do a full walkthrough of every route in the app to confirm nothing broke:

\- /

\- /tenants

\- /properties

\- /maintenance

\- /owners

\- /messages

\- /schedule

\- /reports

\- /applications

\- /settings

\- /owner-portal

Commit with message: \`refactor: App.jsx is now a router only\`

Stop after the commit. Report the final App.jsx line count vs. the baseline captured in Phase 0\.

---

## Phase 12: Audit and Cleanup

Execute Phase 12 of PROPLI-REFACTOR.md.

1\. Search the codebase for hex color codes (pattern: \`\#\[0-9a-fA-F\]{3,8}\`). List every occurrence outside \`src/shared/styles/tokens.js\`. Replace each with the appropriate token import. If a color does not exist in tokens, add it to tokens first, then use it.

2\. Search for inline style objects with identical values across multiple files. Consolidate into shared style constants if they appear 3+ times.

3\. Remove unused imports in every file. Use any built-in linting or just visual inspection.

4\. Delete commented-out code blocks and dead functions.

5\. Run \`npm run build\` and compare the bundle size to the baseline from Phase 0\. Report both numbers.

6\. Create \`REFACTOR-FINDINGS.md\` at the repo root listing any bugs, oddities, or technical debt you noticed during the refactor that were out of scope. Do not fix them here.

Commit with message: \`refactor: cleanup, consolidate duplicated styles, remove dead code\`

Stop after the commit. Do not proceed to Phase 13\.

---

## Phase 13: Merge and Deploy

Execute Phase 13 of PROPLI-REFACTOR.md.

1\. Push the refactor branch: \`git push \-u origin refactor/structural-split\`

2\. Open a pull request against \`main\`. Write a summary that covers:

   \- What was extracted and where

   \- The line count reduction of App.jsx

   \- The bundle size before and after

   \- A link to REFACTOR-FINDINGS.md

   \- An explicit note that no user-facing behavior changed

3\. Self-review the diff. Flag any file over 300 lines or any remaining hex color outside tokens.

4\. After review, merge to main.

5\. Watch the Vercel deploy log. Report the deploy status.

6\. Once deployed, run a full smoke test on propli.app:

   \- Sign in as admin

   \- Walk through tenants, properties, maintenance, owners, messages

   \- Send a test SMS

   \- Sign out

   \- Sign in to owner portal with a test owner

   \- Walk through all four tabs

7\. Report anything that broke in production.

This is the end of the refactor.

---

## If Something Goes Wrong

Stop immediately. Paste this:

The last change caused \[describe what broke\]. Do not continue. 

First, identify the file and line causing the issue. Report what you find.

Then, recommend either:

\- A targeted fix (if small and obvious)

\- A revert with \`git reset \--hard HEAD\~1\` (if unclear or large)

Wait for my approval before acting.

---

## When You Come Back After a Break

If you stop mid-refactor and come back days later, paste this to re-orient Claude Code:

Read CLAUDE.md, AGENTS.md, and PROPLI-REFACTOR.md. Then run \`git log \--oneline \-20\` and tell me which phase of the refactor was last completed. Do not write any code yet.

Then resume with the next phase's prompt from this file.  
