# Super Admin Dashboard Foundation — Design

Date: 2026-07-24
Status: Approved (pre-implementation)
Scope: Phase 2, part 1 — Dashboard Overview (superadmin), Shelters Management, Users Management

## Context

Dashboard Phase 1 (layout, auth, route guards, role-based nav, ComingSoon placeholders) is complete
and approved. Phase 2 begins the Super Admin's real management surface. This first slice covers
exactly three pages: the superadmin variant of the Overview page, Shelters Management, and Users
Management. No other Phase 2 pages (My Shelter, Animals, Adoption Requests, My Profile,
Appointments, Reviews) are in scope here.

Hard constraints carried over from Phase 1 and restated by the user for this phase:
- Reuse the established Paw Match design language (warm orange palette, tokens, motion style)
  exactly — no new "admin theme."
- Reuse shared components; do not duplicate UI that already exists in `packages/ui`.
- Do not modify the backend or API contracts. Use only existing endpoints. If something needed is
  missing, report it — do not invent an endpoint or a query parameter the backend doesn't support.

## Backend inspection findings

Relevant existing endpoints (all already implemented on the backend, unmodified by this work):

**Shelters** (`src/routes/shelter.route.js`, `src/controllers/shelter.controller.js`):
- `GET /shelters/admin/all` (superadmin only) — filters: `verificationStatus` (`pending|approved|rejected`),
  `isActive` (boolean), `city` (case-insensitive regex). **No free-text search, no pagination.**
  Returns every matching shelter, populated with `createdBy` and `verifiedBy`
  (`{_id, firstName, lastName, email, role?}`), sorted `createdAt` desc.
- `PATCH /shelters/:id/approve` — sets `verificationStatus: "approved"`, `isVerified: true`,
  `isActive: true`, clears `rejectionReason`. 400 if already approved.
- `PATCH /shelters/:id/reject` — body `{ reason: string }` (3–1000 chars). Sets
  `verificationStatus: "rejected"`, `isVerified: false`, `isActive: false`.
- `PATCH /shelters/:id/status` — toggles `isActive`. 400 if trying to activate a shelter that isn't
  approved+verified.
- `DELETE /shelters/:id/permanent` — 400 if shelter is still active, 400 if active (non-terminal)
  adoption requests exist against it. Cleans up relations, animals, and Cloudinary assets.

**Users** (`src/routes/user.route.js`, `src/controllers/user.controller.js`):
- `GET /user` (superadmin only) — **no query params supported at all.** Returns every user minus
  sensitive fields, sorted `createdAt` desc.
- `GET /user/:id` — single user by id, same field exclusions.
- `PUT /user/:id/role` — body `{ role }`, role ∈ `shelterEmployee|vet|adopter`. 403 if target is
  superadmin. 400 if role unchanged.
- `PUT /user/:id/status` — body `{ isActive: boolean }`. 400 if changing own account, 403 if target
  is superadmin and `isActive: false`, 400 if status unchanged.

**Gaps identified (reported, not worked around by inventing anything):**
- No server-side search or pagination on either admin list endpoint.
- No dashboard stats/analytics/summary endpoint.
- No activity/audit-log endpoint.
- No user detail/shelter detail page in this phase's scope, and no dedicated "detail" endpoint
  richer than what the list endpoints already return.

## Resolved design decisions

1. **Client-side data operations.** Both admin list endpoints are fetched once (per filter change
   that the backend *does* support — `verificationStatus`/`isActive`/`city` for shelters) and all
   free-text search, additional filtering, sorting, and pagination happen in the browser using
   React Query's cached data. The existing `Pagination` component in `packages/ui` was already
   built and documented for exactly this ("client-side pagination controls — for resources whose
   backend has no server-side pagination"). **Noted for the final report:** server-side search and
   pagination should be revisited if either dataset grows large enough that a full fetch becomes
   expensive.
2. **Delete shelter permanently is included**, but deliberately de-emphasized: it lives inside the
   `RowActionsMenu` overflow (⋮), styled as a danger item, never a primary button. It requires a
   confirmation `Modal` that states the action is irreversible. The button is disabled (with an
   explanatory tooltip) when the shelter is currently active, since the backend requires
   deactivation first — this is a UX hint built from data already on screen, not a re-implementation
   of backend validation (the "no active adoption requests" rule isn't checked client-side at all;
   the backend's rejection message is surfaced verbatim on failure).
3. **Recent activity is derived, not real activity data.** It's built from the 5 most-recently
   created shelters and 5 most-recently created users (both lists already sorted `createdAt` desc by
   the backend), merged and re-sorted by date into one feed. If both source lists are empty, the
   section shows a proper empty state rather than fabricating entries.
4. **Row "View" actions open a read-only quick-view `Modal`** built entirely from data already
   present in the list payload — no new API calls, no new route, no detail page. A full detail page
   is explicitly deferred to a later phase.

## Architecture

### Data layer additions

**Types** (`packages/types/src/shelter.ts`, `packages/types/src/user.ts`):
- `AdminShelter` — the exact shape `GET /shelters/admin/all` returns: all `PublicShelter` fields
  plus `verificationStatus`, `isVerified`, `isActive`, `rejectionReason`, `verifiedAt`, `updatedAt`,
  and populated `createdBy: AdminShelterRef`, `verifiedBy: AdminShelterRef | null` where
  `AdminShelterRef = { _id, firstName, lastName, email, role? }`.
- `AdminUser` — `AuthUser`-shaped (same field exclusions as the profile endpoint) plus `createdAt`.

**API client** (new files, kept separate from the existing public/self-service files per their own
documented boundaries):
- `packages/api-client/src/shelterAdmin.ts`: `getAllSheltersAdmin(client, filters)`,
  `approveShelter(client, id)`, `rejectShelter(client, id, reason)`,
  `toggleShelterStatus(client, id)`, `permanentlyDeleteShelter(client, id)`.
- `packages/api-client/src/userManagement.ts`: `getAllUsers(client)`, `getUserById(client, id)`,
  `updateUserRole(client, id, role)`, `updateUserStatus(client, id, isActive)`.

**Hooks** (new files, mirroring the `createShelterHooks`/`createUserAccountHooks` factory pattern):
- `packages/hooks/src/shelterAdmin.ts` → `createShelterAdminHooks(client)`: `useAdminShelters(filters)`,
  `useApproveShelter()`, `useRejectShelter()`, `useToggleShelterStatus()`,
  `useDeleteShelterPermanently()`. Mutations invalidate the `["shelters", "admin"]` query key on
  success.
- `packages/hooks/src/userManagement.ts` → `createUserManagementHooks(client)`: `useAdminUsers()`,
  `useUpdateUserRole()`, `useUpdateUserStatus()`. Mutations invalidate `["users", "admin"]`.
- Dashboard wires both via two new files in `apps/dashboard/src/lib/` (`shelterAdminHooks.ts`,
  `userManagementHooks.ts`), same pattern as the existing `lib/notificationHooks.ts`.

**Validation** (`packages/validation/src/shelterAdmin.ts`, new): a small zod schema for the
reject-reason field (3–1000 chars, mirrors the backend's express-validator rule exactly).

### New shared components (`packages/ui`)

None of these exist today; all are needed by more than one place in this phase (or clearly will be
by future dashboard phases), so they go in the shared package, not duplicated per page:

- **`Modal`** — generic dialog shell generalized from the existing `QuickViewModal` pattern in
  public-web (backdrop blur + fade, scale/opacity/y motion via Framer Motion, `role="dialog"`,
  `aria-modal`, Escape-to-close, backdrop-click-to-close, focus moved to the dialog on open).
  Props: `isOpen`, `onClose`, `title`, `children`, `footer?`.
- **`Table` primitives** — `Table` (rounded/bordered/shadowed scroll container matching `Card`'s
  chrome), `TableHead`, `TableRow` (hover state), `TableHeaderCell`, `TableCell`. Styled semantic
  `<table>` wrappers; column definitions stay page-specific.
- **`TableSkeleton`** — loading placeholder reusing the existing `Skeleton` atom, structured as
  table rows (same spirit as `ListSkeleton`, different shape).
- **`RowActionsMenu`** — overflow (⋮) dropdown menu, generalized from the open/close/outside-click/
  Escape-key pattern already hand-rolled in `NotificationBell`. Items:
  `{ label, icon?, onClick, tone?: "default" | "danger", disabled?, disabledReason? }`.

Reused as-is, no changes: `Badge`, `Input` (with `leadingIcon`), `Select`, `Button`, `ButtonLink`,
`Pagination`, `EmptyState`, `ErrorState`, `Card`, `Container`, `Textarea`, `UserAvatar`,
`VisuallyHidden`.

### Pages

**Overview (`apps/dashboard/src/pages/OverviewPage.tsx`)** — branches on `auth.user.role`.
`shelterEmployee`/`vet` render exactly what exists today (unchanged). `superadmin` renders a new
`SuperAdminOverview` component:
- `pages/superadmin/SuperAdminOverview.tsx`
- Welcome header (title + role badge) — the existing header markup, extracted so it isn't
  duplicated between the two branches.
- Statistics cards: new `StatCard` component (`components/dashboard/StatCard.tsx`, alongside the
  existing `QuickLinkCard`) — total shelters, pending-approval count, active shelters, total users,
  user counts by role. Computed client-side from `useAdminShelters()` + `useAdminUsers()`.
- Recent activity: `pages/superadmin/components/RecentActivityFeed.tsx` — merges the 5 newest
  shelters + 5 newest users by `createdAt`. `EmptyState` when both are empty; `ListSkeleton` while
  loading; `ErrorState` if either fetch fails.
- Quick action cards: existing `QuickLinkCard`s (Shelters, Users) — unchanged, already present.

**Shelters Management** — `pages/superadmin/SheltersPage.tsx` replaces the `ComingSoonPage` on the
`shelters` route (`App.tsx`, no route-structure change, no new guard).
- `pages/superadmin/components/SheltersFilters.tsx` — search `Input`, verification-status `Select`,
  active/inactive `Select`.
- `pages/superadmin/components/SheltersTable.tsx` — columns: logo+name, city, supported species,
  verification `Badge`, active/inactive `Badge`, created date, row actions.
- Row actions: Approve (direct mutation, pending shelters only), Reject (opens
  `RejectShelterDialog.tsx` — `Modal` + `Textarea` + zod validation), Activate/Deactivate (direct
  mutation via `toggleShelterStatus`), View (`ShelterQuickViewModal.tsx`, read-only), Delete
  permanently (in `RowActionsMenu`, opens `DeleteShelterDialog.tsx` confirm `Modal`).
- States: `TableSkeleton` (loading), `ErrorState` with retry (error), `EmptyState` (filtered result
  empty), `Pagination` (client-side, 10 rows per page).

**Users Management** — `pages/superadmin/UsersPage.tsx` replaces the `ComingSoonPage` on the
`users` route.
- `pages/superadmin/components/UsersFilters.tsx` — search `Input`, role `Select`, active/inactive
  `Select`.
- `pages/superadmin/components/UsersTable.tsx` — columns: `UserAvatar`+name, email, role `Badge`,
  active/inactive `Badge`, row actions.
- Row actions: Change role (`ChangeRoleDialog.tsx` — `Modal` + `Select`; backend's superadmin-role
  guard and "role unchanged" guard errors surfaced verbatim), Activate/Deactivate (direct mutation;
  backend's self-deactivation and superadmin-deactivation guards surfaced verbatim), View
  (`UserQuickViewModal.tsx`, read-only).
- Same `TableSkeleton`/`ErrorState`/`EmptyState`/`Pagination` treatment as Shelters.

## Error handling

All mutations use the existing `getApiErrorMessage` helper (already used by `SignInPage`) to surface
the backend's actual error message on failure (e.g. "Shelter must be approved and verified before
activation", "You cannot change your own account status") rather than a generic failure string.
Every business-rule rejection the backend can produce is display-only from the client's side — no
duplicate validation logic is written for rules the backend already enforces.

## Responsive & motion

Same conventions as Phase 1: Tailwind breakpoints (`sm`/`lg`), tables scroll horizontally on narrow
viewports inside the `Table` container rather than overflowing the page, `Framer Motion` fade/slide-in
for cards and rows consistent with `QuickLinkCard`/`ComingSoonPage`'s existing motion, `useReducedMotion`
respected throughout (matches every existing animated component).

## Out of scope (explicitly deferred)

- Shelter/user detail pages (only quick-view modals this phase).
- Create-user page (`POST /user/create-user` exists on the backend but isn't part of this page set).
- Server-side search/pagination for either admin list (revisit if data volume grows).
- Any page beyond Overview/Shelters/Users (My Shelter, Animals, Adoption Requests, My Profile,
  Appointments, Reviews) — later parts of Phase 2.
