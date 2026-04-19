# Propli Refactor Plan

Execute this plan phase by phase. Do not skip phases. After each phase, run the dev server, click through the affected feature, and commit before moving on. If anything breaks, revert the commit and flag it before continuing.

## Project Context

- Stack: React 18, Vite, Supabase (Postgres, Auth, Storage, Edge Functions), Vercel, Twilio
- Repo: `~/Downloads/pm-crm`
- Live: propli.app and propli.pro
- Main file today: `src/App.jsx` (~500KB, one giant file with all UI and logic)
- Auth model: single admin user today, multi-tenant RLS on Supabase
- Deployed via git push to main (auto-deploy on Vercel)

## Refactor Mission

Split `src/App.jsx` into a feature-based folder structure with a shared design system and Supabase data hooks. Change zero user-facing behavior. Zero new features in this refactor.

## Non-Negotiable Rules

1. Do not change any database schema, RLS policy, Edge Function, or Supabase configuration.
2. Do not rename any route. `/owner-portal` stays `/owner-portal`. Every existing URL must still work.
3. Do not change any visual styling or colors during the refactor. Visual changes happen AFTER the structural refactor is shipped.
4. Do not remove any feature unless explicitly approved by the user in chat.
5. Do not add new npm packages unless required to complete a split.
6. Use functional React components with hooks. No class components.
7. Use named exports for components, default export only for route-level page components.
8. Every new file stays under 300 lines. If it would exceed 300, split further.
9. Commit after every phase with the exact message format specified below.
10. If you run into ambiguity, stop and ask the user before proceeding.

## Target Folder Structure

```
src/
  App.jsx                      // Router only. Under 100 lines.
  main.jsx                     // Entry point. Untouched.
  
  shared/
    components/
      Button.jsx
      Modal.jsx
      Toast.jsx
      Card.jsx
      Input.jsx
      Select.jsx
      Dropdown.jsx
      EmptyState.jsx
      LoadingSpinner.jsx
    hooks/
      useToast.js
      useDebounce.js
      useSupabase.js
    utils/
      formatCurrency.js
      formatDate.js
      phoneFormatter.js
    styles/
      tokens.js                // Design tokens (colors, spacing, typography, shadows)
      globals.css              // Reset + base styles
  
  features/
    tenants/
      TenantsPage.jsx          // Route component
      TenantKanban.jsx
      TenantList.jsx
      TenantCard.jsx
      TenantDetail.jsx
      TenantForm.jsx
      OnboardingWizard.jsx
      OffboardingWizard.jsx
      useTenants.js            // Supabase queries for tenants
    properties/
      PropertiesPage.jsx
      PropertyCard.jsx
      PropertyDetail.jsx
      PropertyForm.jsx
      useProperties.js
    maintenance/
      MaintenancePage.jsx
      MaintenanceCard.jsx
      MaintenanceDetail.jsx
      MaintenanceForm.jsx
      useMaintenance.js
    owners/
      OwnersPage.jsx
      OwnerDetail.jsx
      OwnerForm.jsx
      OwnerStatementGenerator.jsx
      useOwners.js
    messages/
      MessagesPage.jsx
      ConversationList.jsx
      ConversationView.jsx
      useMessages.js
    schedule/
      SchedulePage.jsx
      useSchedule.js
    reports/
      ReportsPage.jsx
      useReports.js
    applications/
      ApplicationsPage.jsx
      ApplicationDetail.jsx
      ScreeningReport.jsx
      useApplications.js
    settings/
      SettingsPage.jsx
      useSettings.js
    dashboard/
      DashboardPage.jsx
    owner-portal/
      OwnerPortalApp.jsx       // Separate sub-app for /owner-portal
      OwnerLogin.jsx
      OwnerDashboard.jsx
  
  lib/
    supabase.js                // Supabase client (already exists, relocate)
    constants.js               // App-wide constants
```

## Design Tokens (build this first, use everywhere after)

Create `src/shared/styles/tokens.js` with this structure:

```js
export const colors = {
  brand: {
    primary: '#1a73e8',
    primaryHover: '#1557b0',
    accent: '#6366f1',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  neutral: {
    50:  '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    500: '#6b7280',
    700: '#374151',
    900: '#111827',
  },
  surface: {
    background: '#ffffff',
    subtle: '#f9fafb',
    border: '#e5e7eb',
  }
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48
};

export const radius = {
  sm: 4, md: 8, lg: 12, xl: 16, full: 9999
};

export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.06)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
};

export const typography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  sizes: { xs: 12, sm: 13, base: 14, md: 15, lg: 16, xl: 18, '2xl': 20, '3xl': 24, '4xl': 32 },
  weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
};
```

After this file exists, every future extraction must import from tokens. No more hex codes scattered in JSX.

## Execution Phases

Follow the exact order. Each phase ends with a test pass and a commit.

### Phase 0: Baseline and Safety

1. Run `npm run dev`. Confirm app loads at localhost:5173.
2. Run `npm run build`. Confirm build succeeds.
3. Create a new branch: `git checkout -b refactor/structural-split`
4. Note current `src/App.jsx` line count. Record it in a comment at the top of this file for later comparison.

Commit: `chore: start structural refactor, baseline captured`

### Phase 1: Folder Scaffolding and Design Tokens

1. Create all folders from the target structure above. Empty folders with a `.gitkeep` file.
2. Create `src/shared/styles/tokens.js` with the design tokens above.
3. Create `src/shared/styles/globals.css`. Move any global CSS currently in `index.css` or inline in App.jsx here. Do not change values.
4. Do not modify App.jsx yet.

Test: `npm run dev`. App still works.

Commit: `refactor: scaffold folder structure and design tokens`

### Phase 2: Extract Shared UI Primitives

Identify these recurring patterns in App.jsx and extract to `src/shared/components`:
- Button styles used in more than two places
- Modal wrapper (centered overlay with backdrop)
- Toast notification
- Form input wrapper with label and error state
- Card container
- Dropdown / Select

For each primitive:
1. Find every inline instance in App.jsx
2. Create the shared component using tokens
3. Replace inline instances with imports from `src/shared/components`
4. Verify the UI looks identical

Test after each primitive: dev server visual check.

Commit: `refactor: extract shared UI primitives to src/shared/components`

### Phase 3: Extract Supabase Client and Utilities

1. Move Supabase client init into `src/lib/supabase.js` if not already there.
2. Extract format helpers (currency, date, phone) from App.jsx into `src/shared/utils/`.
3. Update imports everywhere.

Test: dev server.

Commit: `refactor: centralize supabase client and shared utils`

### Phase 4: Extract Tenant Feature

Tenants is the biggest feature and the best test of the pattern. Do this one carefully.

1. Create `src/features/tenants/useTenants.js`. Move every Supabase query touching the `tenants` table into this hook. Export functions like `useTenants()`, `useTenant(id)`, `createTenant()`, `updateTenant()`, `deleteTenant()`.
2. Create `src/features/tenants/TenantCard.jsx`. Move the card render logic here.
3. Create `src/features/tenants/TenantKanban.jsx`. Move the kanban board logic here. Import TenantCard.
4. Create `src/features/tenants/TenantList.jsx`. Move the list/table view here.
5. Create `src/features/tenants/TenantDetail.jsx`. Move the detail panel here.
6. Create `src/features/tenants/TenantForm.jsx`. Move the add/edit form here.
7. Create `src/features/tenants/OnboardingWizard.jsx`. Move the onboarding wizard here.
8. Create `src/features/tenants/OffboardingWizard.jsx`. Move the offboarding wizard here.
9. Create `src/features/tenants/TenantsPage.jsx`. This is the route component that wires the above together and owns the tab switching between Kanban/List.
10. In App.jsx, replace the entire Tenants section with `<TenantsPage />`.

Test protocol for tenants:
- Load tenants page, verify all tenants render
- Switch between kanban and list views
- Open a tenant detail
- Edit a tenant and save
- Run onboarding wizard with a test tenant
- Run offboarding wizard
- Verify status filters work
- Verify search works

Commit: `refactor: extract tenants feature to src/features/tenants`

### Phase 5: Extract Properties Feature

Same pattern as tenants. Files: `useProperties.js`, `PropertyCard.jsx`, `PropertyDetail.jsx`, `PropertyForm.jsx`, `PropertiesPage.jsx`.

Test: load properties, add a property, edit a property, link to tenants.

Commit: `refactor: extract properties feature`

### Phase 6: Extract Maintenance Feature

Files: `useMaintenance.js`, `MaintenanceCard.jsx`, `MaintenanceDetail.jsx`, `MaintenanceForm.jsx`, `MaintenancePage.jsx`.

Test: load maintenance, create a request, update status, assign vendor, verify auto-creation from SMS still works end to end by sending a test SMS.

Commit: `refactor: extract maintenance feature`

### Phase 7: Extract Owners Feature

Files: `useOwners.js`, `OwnerDetail.jsx`, `OwnerForm.jsx`, `OwnerStatementGenerator.jsx`, `OwnersPage.jsx`.

Test: load owners, assign property to owner, generate an owner statement, verify percentages math.

Commit: `refactor: extract owners feature`

### Phase 8: Extract Messages (SMS) Feature

Files: `useMessages.js`, `ConversationList.jsx`, `ConversationView.jsx`, `MessagesPage.jsx`.

Test: load messages, verify existing conversations render, send a test outbound SMS, receive a test inbound SMS via Twilio.

Commit: `refactor: extract messages feature`

### Phase 9: Extract Schedule, Reports, Applications, Settings, Dashboard

Same pattern for each. Smaller features, so likely 2-4 files per feature.

Test each after extraction.

Commits: one per feature.

### Phase 10: Extract Owner Portal

The owner portal at `/owner-portal` is effectively a second app inside the same repo. Extract into `src/features/owner-portal/` with its own sub-router.

Test: log in as an owner, verify all four portal tabs (overview, properties, tenants, statements) render.

Commit: `refactor: extract owner portal`

### Phase 11: Slim Down App.jsx

At this point App.jsx should be mostly an empty shell. Reduce it to a router that imports each feature page. Target: under 100 lines.

Test: full app walkthrough, every route.

Commit: `refactor: App.jsx is now a router only`

### Phase 12: Audit and Cleanup

1. Search the codebase for hex color codes. Replace any stragglers with tokens.
2. Search for inline style objects duplicated across files. Consolidate.
3. Delete unused imports across every file.
4. Remove dead code and commented-out blocks.
5. Run `npm run build` and check the bundle size. Note before/after.

Commit: `refactor: cleanup, consolidate duplicated styles, remove dead code`

### Phase 13: Merge and Deploy

1. Push branch to GitHub.
2. Open a PR against main with a summary of what changed and what did not.
3. Self-review the diff before merging.
4. Merge to main.
5. Verify Vercel deploy succeeds.
6. Smoke test production: load propli.app, check tenants, properties, maintenance, owner portal.

## Testing Checklist After Each Feature Extraction

Run through this list for the feature you just extracted:

- [ ] Page loads without console errors
- [ ] List/grid renders all expected records
- [ ] Detail view opens on click
- [ ] Create flow works end to end
- [ ] Edit flow works end to end
- [ ] Delete flow (if present) works
- [ ] Search and filter work
- [ ] Mobile responsive (check at 375px width)
- [ ] Related features still work (e.g., tenants still link to properties)

## Commit Message Format

`refactor: <what you extracted or changed>`

No feature commits, no style commits, no fix commits during this refactor. If you find a bug during the refactor, note the bug in a `REFACTOR-FINDINGS.md` file but do not fix it here. Bug fixes happen after the refactor merges.

## What to Do If Something Breaks

1. Stop. Do not keep coding through breakage.
2. Check the browser console and terminal for the error.
3. Check the last file you edited for typos or bad imports.
4. If the issue is non-obvious, `git stash` or `git reset --hard HEAD` to the last working commit.
5. Document the issue in `REFACTOR-FINDINGS.md`.
6. Ask the user before retrying a different approach.

## What to Flag to the User

Flag these as soon as you notice them, do not fix silently:
- Any feature you find in App.jsx that seems unused or broken
- Any file over 300 lines after splitting
- Any function that looks duplicated across features
- Any Supabase query without proper error handling
- Any use of `localStorage` or `sessionStorage` (these break in some contexts)
- Any hardcoded secrets or API keys in the code

## Success Criteria

The refactor is done when:
- `src/App.jsx` is under 100 lines and only routes
- Every feature lives in its own folder
- No hex color codes exist outside `tokens.js`
- Every file is under 300 lines
- The production app at propli.app works identically to before
- Build size is equal or smaller than baseline
- You can find any piece of tenant logic in under 10 seconds

## Out of Scope for This Refactor

Do not touch during this refactor:
- Database schema
- Edge Functions
- Twilio configuration
- Vercel configuration
- Any feature not currently in App.jsx
- Visual redesign (that comes next, on a clean foundation)
- Finishing the move-in/move-out checklist (that comes after this)
- Scaling demo data to 500 doors (that comes after this)

## After This Ships

Once the refactor is merged and stable, the next work items are:
1. Finish the move-in/move-out checklist on the clean foundation
2. Scale demo data to 500 records for the upcoming demo
3. Visual refresh using design tokens
4. Discovery call with the family member operator
