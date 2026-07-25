# Shelter Employee Dashboard — Design Specification

Date: 2026-07-24
Status: Draft — awaiting approval before an implementation plan is written
Scope: Phase 3 — Shelter Employee Dashboard foundation

## Context

Dashboard Phase 1 (layout, auth, guards, role-based nav, ComingSoon placeholders) and Phase 2
(Super Admin — Overview, Shelters Management, Users Management) are complete and approved. Phase 3
covers the `shelterEmployee` role's own management surface. This document is the output of a
discovery pass over the backend (`src/routes`, `src/controllers`, `src/models`, `src/validation`)
and the existing frontend (`packages/*`, `apps/public-web`, `apps/dashboard`) — no code was written
or endpoints called beyond read-only `GET`s against already-existing seeded data, per the discovery
rules for this phase.

Hard constraints restated: don't modify the backend; use only existing, confirmed endpoints; don't
invent routes/params/permissions/fields; reuse shared components before creating new ones;
role-specific components stay inside `apps/dashboard`; no new npm dependencies; preserve Phase 1/2
work exactly.

## Critical backend finding: the Manager-permission gate is non-functional

`checkShelterEmployeePermission` (`src/controllers/shelter.controller.js:18-74`) is the single gate
behind eight endpoints: `updateShelter`, `addEmployee`, `removeEmployee`, `uploadLogo`,
`replaceLogo`, `deleteLogo`, `addShelterImages`, `deleteShelterImage`. For a non-superadmin caller it
runs:

```js
ShelterEmployeeProfile.findOne({ userId, shelterId: shelter._id, isActive: true, position: "Manager" })
```

`ShelterEmployeeProfile.position` is schema-declared as `enum: ["manager", "employee"]` with
`lowercase: true` (`src/models/ShelterEmployeeProfile.js:18-24`) — every stored value is lowercase.
Mongoose does not lowercase a raw query filter value, so this query searches for the literal string
`"Manager"`, which can never match a stored `"manager"`. **Every one of those 8 endpoints currently
returns 403 for every `shelterEmployee`, regardless of actual position.** Seed data confirms stored
values are lowercase (`src/seed.js:613,629`). Only `superadmin` can currently reach these endpoints.

This is a backend bug, not a contract we can build around — per rule #1, it isn't ours to fix. **Per
your decision, this phase pauses everything gated by it**: shelter-profile editing, shelter
logo/gallery management, and employee add/remove are excluded from this phase's scope entirely, to
be revisited once the backend fix ships. Everything else investigated below (animals, adoption
requests, review replies) is gated by separate, working, non-Manager-scoped checks and is unaffected.

## Confirmed capabilities by resource

### Shelter Employee Profile (`/api/v1/shelter-employee-profile`)

- `GET /me` — `[auth, role(["shelterEmployee"])]`. The **only** self-service endpoint. Returns
  `{success, message, data}` where `data` is the `ShelterEmployeeProfile` with `userId` populated
  (`firstName lastName email phone dateOfBirth gender address profileImage role isActive`) and
  `shelterId` populated (`name address city phone email`). 404 if no profile exists.
  **This is the only way a shelterEmployee learns their own shelter's `_id`** (`data.shelterId._id`).
- Fields: `userId, shelterId (ref Shelter, nullable), position ("manager"|"employee", default
  "employee"), employeeNumber (nullable), hireDate (nullable), isActive, createdAt, updatedAt`.
- `PUT /:userId/work-data` (change position/employeeNumber/hireDate) and `GET /`/`GET /:userId`
  (list/get any employee's profile) are **superadmin-only** — a shelterEmployee cannot see or change
  their own `position`, and cannot look up any other employee's profile at all.

### My Shelter (read-only this phase)

- `GET /shelters/:id` — `[auth]`, no role restriction. For a `shelterEmployee` with an active
  `ShelterEmployeeProfile` linked to that shelter id, returns the "employee" access branch: full
  shelter fields plus populated `employees` (`firstName lastName email phone role profileImage
  isActive`) and populated `animalIds` (`name species breed gender age ageUnit size color
  adoptionStatus healthStatus vaccinated images isActive`, plus `addedBy`). `accessLevel:
  "shelterEmployee"` in the response.
- No dedicated "my shelter" endpoint exists — the flow is always `GET /me` → `shelterId._id` →
  `GET /shelters/:id`.
- **Excluded this phase** (paused per the Manager-gate bug): `updateShelter`, logo upload/replace/
  delete, gallery image add/delete. The page is a pure read view.

### Animals (`/api/v1/animals`) — fully functional, no Manager gate

`canManageAnimal` (`src/controllers/animal.controller.js:47-73`) only checks that the acting
shelterEmployee has an active profile whose `shelterId` matches the animal's `shelterId` — **no
position check**. Confirmed endpoints, all reachable by any active shelterEmployee of the owning
shelter:

- `GET /` — query params `species, breed, gender, size, healthStatus, adoptionStatus, shelterId,
  vaccinated, isActive, search` are all real, server-side. **`isActive` is force-set to `true` for
  every non-superadmin caller regardless of the query value** — a shelterEmployee can never list
  their shelter's soft-deleted animals through this endpoint. No pagination, no sort param; returns
  the full matching array. `search` is a case-insensitive regex over `name, breed, description`.
- `GET /:id` — same `isActive: true` restriction, no exception for the owning shelterEmployee. 404
  for a soft-deleted animal even if it belongs to your own shelter.
- `POST /` — body: `name, age, ageUnit, species, breed, gender, size, color, healthStatus,
  vaccinated, description, requirements{homeType, suitableForKids, goodWithOtherPets,
  experienceLevel, dailyActivityLevel, ownerType, hypoallergenic}`. `shelterId` is derived
  server-side from the caller's own profile (client cannot set it); `images`/`isActive`/
  `adoptionStatus`/`addedBy` are rejected if present in the body (400). Requires the shelter itself
  to be approved+verified+active (403 otherwise). New animals are forced `adoptionStatus:
  "unavailable"` and `images: []` — **an animal isn't adoptable until at least one image is added.**
- `PATCH /:id` — same field set as create, minus `shelterId` (superadmin-only transfer — 403 for a
  shelterEmployee who includes it), and `isActive`/`adoptionStatus`/`images` are rejected (400 —
  "must be changed through delete/restore/adoption-process/image endpoints").
- `DELETE /:id` (soft delete) — sets `isActive: false` only. 400 if already inactive. **400 if
  `adoptionStatus === "adopted"`** — adopted animals cannot be deleted.
- `PATCH /:id/restore` — sets `isActive: true`. 400 if already active. 403 if the owning shelter
  isn't currently approved+verified+active. If the animal has zero images, `adoptionStatus` is
  forced back to `"unavailable"`.
- Image sub-endpoints, all requiring `canManageAnimal` and the animal to be `isActive`:
  - `POST /:id/images` — multipart field **`images`** (array), max 8 total on the animal (400 past
    that). First-ever image is auto-marked primary and flips `adoptionStatus` `"unavailable"` →
    `"available"`.
  - `PATCH /:id/images/:imageId` — multipart field **`image`** (single) — replaces one image,
    preserves its `isPrimary` flag.
  - `PATCH /:id/images/:imageId/primary` — marks one image primary, clears the rest.
  - `DELETE /:id/images/:imageId` — if the deleted image was primary, the next remaining one becomes
    primary; if it was the last image, `adoptionStatus` is forced to `"unavailable"`.
  - `DELETE /:id/images` — clears all images, forces `adoptionStatus: "unavailable"`.

**Confirmed gap:** because both list and detail reads force `isActive: true`, there is no backend
capability to ever list or view a soft-deleted animal as a shelterEmployee. Per your decision,
Restore is implemented only as an immediate, session-scoped "Undo" affordance surfaced right after a
successful Delete (before the list refetches) — never as a persistent "view deleted animals" list,
because no endpoint can support that list.

### Adoption Requests (`/api/v1/adoptions`) — fully functional, no Manager gate

`checkShelterPermission` (`src/controllers/adoptionRequest.controller.js:18-53`) only requires an
active `ShelterEmployeeProfile` linked to the request's (approved+verified+active) shelter — **no
position check**.

- `GET /shelter` — query params `animalId, adopterId, status` are real server-side filters
  (`shelterId` param exists but is superadmin-only; for a shelterEmployee it's forced to their own
  shelter). No free-text search param, no pagination. Populates `adopterId` (`firstName lastName
  email phone address profileImage`), `animalId` (`name species breed gender age ageUnit images
  adoptionStatus`), `shelterId` (`name city address`), `reviewedBy` (`firstName lastName role`).
- `GET /:id` — richer populate than the list (`animalId` additionally includes `size healthStatus
  vaccinated isActive`, `adopterId` additionally includes `isProfileCompleted`). Gated by the same
  `checkShelterPermission`.
- Status model: `pendingReview → interview → homeCheck → approved → completed`, with `rejected` and
  `cancelled` as terminal branches. Confirmed valid transitions, each independently permission- and
  state-gated in the controller:
  - `PATCH /:id/status`, body `{status}` restricted to **`"interview"` or `"homeCheck"`** only.
    Transition map: `pendingReview → interview`, `interview → homeCheck`, `homeCheck → []` (no
    further use of this endpoint). 400 if the current status is already
    `approved|rejected|cancelled|completed`, or if the target isn't valid from the current status.
  - `PATCH /:id/approve` — **only from `homeCheck`**. Atomically flips the animal `available →
    pending` (409 if the animal isn't in that state); bulk-rejects every other active request for
    the same animal with reason `"Another adoption request was approved for this animal"`.
  - `PATCH /:id/reject`, body `{rejectionReason}` (**required, 3-1000 chars**) — only from
    `pendingReview|interview|homeCheck` (409 otherwise, race-safe conditional update).
  - `PATCH /:id/complete` — **only from `approved`**. Atomically flips the animal `pending →
    adopted`.
  - `PATCH /:id/cancel-approval`, body `{reason}` (**required, 3-1000 chars**) — **only from
    `approved`**. Atomically flips the animal `pending → available`. Ends the request in status
    `"rejected"` (not a distinct "cancelled" value) with the given reason recorded as
    `rejectionReason`.
- Not available to shelterEmployee: creating a request, `GET /my`, adopter-initiated `PATCH
  /:id/cancel`.

### Reviews — out of scope this phase (investigated per your request, not building it)

Only one shelterEmployee-permitted action exists: `PUT /reviews/:id/reply`, body `{text}` (required,
≤1000 chars), gated on an active profile linked to the reviewed shelter (`review.targetType ===
"shelter"`, `review.targetId === shelterId`), one reply per review (409 if already replied), no
position check. There is no shelterEmployee-scoped "list my shelter's reviews" endpoint — the
public, unauthenticated `GET /reviews/target/:targetType/:targetId` is the only listing mechanism.
`/reviews` in `apps/dashboard/src/routes/paths.ts` already exists as a shared `ComingSoonPage` stub
for `shelterEmployee` + `vet` (Phase 1) — it stays a placeholder; this phase does not touch it.

### Notifications — no work needed

Confirmed role-agnostic (`[auth]` only, no `role()` gate on any of the 4 routes) — already fully
working for every role via Phase 1's `NotificationBell`/`notificationHooks`. Nothing to add.

## Confirmed page scope (this phase)

1. **Shelter Employee Overview** — welcome header (existing pattern), shelter summary, animal
   statistics, adoption-request statistics, recent-records feed (derived from real data only), quick
   actions. Same architecture as Phase 2's `SuperAdminOverview`: `OverviewPage.tsx` gains a third
   role branch.
2. **My Shelter** — read-only: shelter info, verification/active-status badges, contact info,
   address/location, operating hours, capacity/supported species, logo/gallery images (display
   only). No edit action, no logo/photo management, no employee add/remove link.
3. **Animals Management** — table/cards with search + filters (server-side where the backend
   supports them) + client-side sort/pagination, quick-view (list data only), create, edit, soft
   delete with session-only undo, image management (add/replace/set-primary/delete/delete-all).
4. **Adoption Requests Management** — list with server-side `animalId`/`adopterId`/`status` filters
   + client-side search/pagination, quick-view (list data only), the exact valid status actions per
   current status (move to interview/home check, approve, reject with reason, complete, cancel an
   approved request with reason).
5. **Shelter Employees** — read-only team list: name, email, phone, role, active-status only (no
   position/hire-date — that lookup is superadmin-only for anyone but yourself). No add/remove.

Not in scope this phase: shelter profile editing, shelter logo/gallery management, employee add/
remove, a Reviews page, or any dedicated "view deleted animals" surface.

## Navigation structure

No changes needed to `Sidebar.tsx`'s `navByRole.shelterEmployee` (already: Overview, My Shelter,
Animals, Adoption Requests, Reviews) or `routes/paths.ts` (`myShelter`, `animals`,
`adoptionRequests`, `reviews` already reserved). `App.tsx`'s three `ComingSoonPage` routes under the
`shelterEmployee`-gated `<Route>` block get replaced with real pages for `shelter`, `animals`,
`adoption-requests`; `reviews` stays `ComingSoonPage`. A new "Shelter Employees" page needs a route —
propose `/shelter/employees` (nested under the existing `shelter` path) rather than a new top-level
sidebar entry, linked from within the My Shelter page rather than added as its own sidebar item,
since it's a read-only sub-view of "my shelter," not an independent section.

## Permissions by shelter employee position

**No functional position-based differentiation exists today.** `GET /shelter-employee-profile/me`
does return the caller's own `position` (`"manager"` or `"employee"`), but every endpoint that was
*intended* to be Manager-gated is currently broken (see Critical backend finding above) and is
excluded from this phase regardless of position. Every endpoint actually used this phase (animals,
adoption requests) applies a flat "any active employee of the matching shelter" rule with no
Manager/Employee distinction. **The frontend must not gate any UI on `position` this phase** — doing
so would incorrectly imply a Manager gets capabilities that, per the confirmed backend behavior, they
still cannot successfully use. When the backend bug is eventually fixed, a future phase can
conditionally show "My Shelter" editing / employee add-remove based on `position === "manager"`
(compared case-insensitively, to be safe against the same class of bug).

## API endpoint mapping

| Page | Endpoint | Notes |
|---|---|---|
| Overview | `GET /shelter-employee-profile/me` | resolve own shelterId |
| Overview | `GET /shelters/:id` | shelter summary |
| Overview | `GET /animals?shelterId=<mine>` | animal stats + recent (client-derived) |
| Overview | `GET /adoptions/shelter` | request stats + recent (client-derived) |
| My Shelter | `GET /shelter-employee-profile/me`, `GET /shelters/:id` | read-only display |
| Animals | `GET /animals?shelterId=<mine>&search=&species=&gender=&size=&healthStatus=&adoptionStatus=&vaccinated=` | server-side filters; client-side sort + pagination (10/page) |
| Animals | `POST /animals` | create |
| Animals | `PATCH /animals/:id` | edit |
| Animals | `DELETE /animals/:id` | soft delete (+ session-only undo via restore) |
| Animals | `PATCH /animals/:id/restore` | undo affordance only |
| Animals | `POST /animals/:id/images`, `PATCH /animals/:id/images/:imageId`, `PATCH /animals/:id/images/:imageId/primary`, `DELETE /animals/:id/images/:imageId`, `DELETE /animals/:id/images` | image management |
| Adoption Requests | `GET /adoptions/shelter?animalId=&adopterId=&status=` | server-side filters; client-side search + pagination (10/page) |
| Adoption Requests | `PATCH /:id/status` (`interview`\|`homeCheck`), `PATCH /:id/approve`, `PATCH /:id/reject`, `PATCH /:id/complete`, `PATCH /:id/cancel-approval` | status actions, gated by current status per the transition rules above |
| Shelter Employees | `GET /shelters/:id` (reuse My Shelter's fetch/cache) | `employees` array, read-only |

No server-side pagination or free-text search exists for adoption requests, or pagination for
animals — consistent with the client-side approach already established and approved in Phase 2
(`Pagination` in `packages/ui` is documented for exactly this).

## Nullable / populated field risks (learned from Phase 2's real `createdBy: null` bug)

- `Shelter.employees[]` populate can plausibly return `null` entries the same way `createdBy` did in
  Phase 2 if a referenced User was deleted — the Shelter Employees list and My Shelter's team display
  must filter out null entries defensively, not assume every populated ref exists.
- `AdoptionRequest.reviewedBy` is already nullable in the existing type (`AdoptionRequestReviewerRef
  | null`) — no change needed, just confirm every render site handles it.
- `Animal.description` is already optional/nullable in the existing type.
- `ShelterEmployeeProfile.shelterId`, `employeeNumber`, `hireDate` are all nullable — an employee
  with no shelter assigned yet (`shelterId: null`) must be handled (Overview/My Shelter should show
  an "not yet assigned to a shelter" state rather than crash on `profile.shelterId._id`).

## UI states

Loading/error/empty/success follow the exact Phase 2 conventions: `TableSkeleton` (sized to each
table's real column count) while loading, `ErrorState` with retry on failure, `EmptyState` when a
filtered result set is empty, success renders the real table/list + `Pagination`. The same pattern
extends to card-based layouts if animals are rendered as cards on narrow screens (see Responsive
behavior).

## Modal and confirmation flows

- **Create/Edit Animal**: a single `Modal`-based form (reusing the shared `Modal`, `Input`, `Select`,
  `Textarea`) covering all creatable/editable fields including the `requirements` sub-object,
  grouped visually. Kept as a modal (not a new route) to stay consistent with Phase 2's dialog
  pattern and avoid adding new top-level pages.
- **Manage Animal Images**: a separate modal (opened from a row action on an existing animal) with
  upload (multi-file, field `images`), a per-image "Set primary"/"Delete" control, and "Delete all" —
  built on a **new** shared image-upload component (see below), since none exists in `packages/ui`
  today.
- **Delete Animal**: confirm `Modal` (mirrors `DeleteShelterDialog`'s irreversibility-warning
  pattern, minus the "permanent" framing since this is a soft delete) with an inline "Undo" toast/
  banner immediately after success, valid only until the list is refetched or the user navigates
  away.
- **Reject Adoption Request** / **Cancel Approved Request**: `Modal` + `Textarea` reason field,
  mirroring `RejectShelterDialog` exactly (both require a 3-1000-char reason server-side).
- **Move to Interview / Home Check / Approve / Complete**: simple direct actions (trivial or empty
  request bodies) — a lightweight confirm step (not a full modal) is enough, consistent with how
  Phase 2 handled Approve/Activate as direct `Button` actions rather than dialogs.
- **Quick-view** (Animal, Adoption Request): read-only `Modal` built entirely from already-fetched
  list data — no additional API calls, matching the approved Phase 2 principle exactly.

## Responsive behavior

Same breakpoints and verification points as Phase 1/2: 375px, 768px, 1024px, 1440px. Tables scroll
horizontally inside their own container rather than overflowing the page (existing `Table`
component already does this). Animals Management uses a **card grid, not a table** — animal records
are far more visual (primary image, species/size/health at a glance) than shelters/users were, and a
6-7-column table row would bury the photo. Cards follow `apps/public-web`'s existing `AnimalCard`
visual language (adapted, not reused directly, since that component is adopter-facing and has no
row-action affordances), laid out responsively (1 column at 375px, 2 at 768px, 3 at 1024px+),
consistent with the existing `PAGE_SIZE`/`Pagination` client-side pattern. Adoption Requests keeps
the `Table` layout (Phase 2 style) since its rows are data-dense (adopter, animal, status, dates)
rather than image-led.

## Shared-component reuse

Reused as-is: `Badge`, `Input`, `Select`, `Button`, `Textarea`, `Modal`, `Table`/`TableHead`/
`TableBody`/`TableRow`/`TableHeaderCell`/`TableCell`, `TableSkeleton`, `RowActionsMenu`, `Pagination`,
`EmptyState`, `ErrorState`, `Card`, `Container`, `UserAvatar`, `VisuallyHidden`, `IconBadge`,
`QuickLinkCard`, `StatCard` (all already exist from Phases 1-2).

## New shared components needed

- **Image uploader** (`packages/ui`, new): a generic file-input + thumbnail-preview component
  supporting both single-file (future logo/replace use) and multi-file (animal images, future
  shelter gallery) modes. Nothing like this exists in `packages/ui` today (confirmed by reading its
  full export list) and it is clearly reusable beyond this phase (shelter logo/gallery once the
  Manager-gate bug is fixed) — it belongs in the shared package, not duplicated Dashboard-side.

No other new shared primitives are anticipated — status badges reuse the existing `Badge` component
with a page-local tone-mapping object, following the exact pattern already used for
`verificationTone`/`roleTone` in Phase 2's Shelters/Users tables (not centralized, per that
established convention).

## New Dashboard-specific components (role-specific, stay in `apps/dashboard`)

`ShelterEmployeeOverview`, a `RecentRecordsFeed` (animals + adoption requests, analogous to Phase
2's `RecentActivityFeed` but not shared with it — different semantics, small enough not to warrant a
shared abstraction per YAGNI), `MyShelterPage` (read-only), `ShelterEmployeesPage` (read-only),
`AnimalsPage` + filters/card-grid/`AnimalCard` (Dashboard-specific, distinct from public-web's)/
create-edit-modal/image-management-modal/quick-view-modal/delete-confirm-dialog,
`AdoptionRequestsPage` + filters/table/quick-view-modal/reject-dialog/cancel-approval-dialog.

## New data-layer additions needed (types / api-client / hooks / validation)

Following the exact separate-file convention established in Phase 2 (e.g. `shelterAdmin.ts` kept
apart from the adopter-facing `shelters.ts`):

- **Types**: extend `animal.ts` with `CreateAnimalPayload`/`UpdateAnimalPayload`; extend
  `adoptionRequest.ts` with an adopter-ref shape (currently absent — the existing `AdoptionRequest`
  type is explicitly documented as adopter-app-only and omits adopter info) and reason-payload types;
  a new `shelterEmployeeProfile.ts` type mirroring `GET /me`'s response.
- **api-client**: new `animalManagement.ts` (create/update/delete/restore/image endpoints — kept
  apart from the existing adopter-facing `animals.ts`, which only has `getAnimals`/`getAnimalById`);
  new `adoptionRequestShelter.ts` (list-by-shelter, get-by-id, status/approve/reject/complete/
  cancel-approval — kept apart from the existing adopter-facing `adoptionRequests.ts`); new
  `shelterEmployeeProfile.ts` (`getMyShelterEmployeeProfile`).
- **hooks**: new `createAnimalManagementHooks` and `createAdoptionRequestShelterHooks` factories
  (separate from the existing `createAnimalHooks`/`createAdoptionRequestHooks`, same reasoning), new
  `createShelterEmployeeProfileHooks`.
- **validation**: new `animal.ts` zod schema (mirrors the backend's exact field constraints), reject/
  cancel-approval reason schemas mirroring `shelterAdmin.ts`'s `rejectShelterSchema` pattern.

## Known backend limitations (carried into the implementation plan as constraints, not workarounds)

1. Shelter-management write endpoints (edit, logo, gallery, add/remove employee) are unreachable for
   any shelterEmployee due to the Manager-gate case-sensitivity bug — excluded this phase.
2. A shelterEmployee can never fetch another employee's `position`/`employeeNumber`/`hireDate` (that
   lookup is superadmin-only) — the Shelter Employees list omits these fields entirely.
3. A shelterEmployee can never list or view a soft-deleted animal — Restore is a session-only undo,
   never a persistent list.
4. No free-text search exists server-side for adoption requests, and no pagination exists
   server-side for either animals or adoption requests — both handled client-side, consistent with
   the already-approved Phase 2 pattern.
5. `isActive` query filtering on `GET /animals` is ignored for non-superadmin roles (always forced
   `true`) — cannot be used as a "show inactive" toggle for shelterEmployee under any circumstance.

## Features explicitly excluded from this phase

- Editing shelter profile information, logo, or gallery images.
- Adding or removing shelter employees.
- Any "view deleted animals" list or persistent restore workflow.
- A Reviews page (reply-to-review capability confirmed to exist server-side, but out of scope per
  the page list you approved — `/reviews` remains the shared Phase 1 `ComingSoonPage` stub).
- Vet Dashboard concerns (separate future phase).
