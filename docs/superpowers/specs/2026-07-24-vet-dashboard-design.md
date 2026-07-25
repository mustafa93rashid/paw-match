# Vet Dashboard — Design Specification

Date: 2026-07-24
Status: Draft — awaiting approval before an implementation plan is written
Scope: Phase 4 — Vet Dashboard foundation

## Context

Dashboard Phases 1-3 (layout/auth/guards, Super Admin, Shelter Employee) are complete and approved.
Phase 4 covers the `vet` role's own management surface. This document is the output of a discovery
pass over the backend (`src/routes`, `src/controllers`, `src/models`, `src/validation`) and the
existing frontend (`packages/*`, `apps/public-web`, `apps/dashboard`) — no code was written or
endpoints called beyond what prior phases already verified read-only against seeded data.

Hard constraints restated: don't modify the backend; use only existing, confirmed endpoints; don't
invent routes/params/permissions/fields; reuse shared components before creating new ones;
role-specific components stay inside `apps/dashboard`; no new npm dependencies; preserve Phases 1-3
work exactly; keep every out-of-scope route (including the shared `/reviews` placeholder) on
`ComingSoonPage` — nothing belonging to a later phase gets touched.

## Good news: no analogue of Phase 3's Manager-gate bug

Phase 3 found that `checkShelterEmployeePermission` is broken for `shelterEmployee` callers. That
bug **does not apply to `vet` at all** — the same function rejects any caller whose role isn't
literally `"shelterEmployee"` before it ever reaches the broken query
(`src/controllers/shelter.controller.js:42-44`). Vets never call that function via any endpoint this
phase touches. Every endpoint below was independently confirmed to have no comparable defect.

## Confirmed capabilities by resource

### Vet Profile (`/api/v1/vet-profile`) — fully functional self-service, unlike Phase 3's My Shelter

- `GET /me` — `[auth, role(["vet"])]`. Returns `{success, message, data}` where `data` is the
  `VetProfile` with `userId` populated (`firstName lastName email phone dateOfBirth gender address
  profileImage role isActive`), `shelterId` populated (`name email phone address city logo isActive`,
  null if not affiliated with a shelter), and an embedded `reviews` array (already-published reviews
  targeting this vet — see Reviews section). 404 if no profile exists.
- `PUT /me` — `[auth, role(["vet"])]`. **Whitelisted fields**: `specialization, bio, experienceYears,
  availableDays, consultationTypes`. Any other key → 400 (`"These fields are not allowed: ..."`).
  Empty body → 400 (`"At least one field must be provided"`). Cannot touch `userId`, `shelterId`, or
  `isActive` — a vet cannot self-detach from a shelter or self-deactivate. Field constraints:
  `specialization` (optional, 2-100 chars), `bio` (optional, ≤1000 chars), `experienceYears`
  (optional, integer 0-80 — validation-layer cap; the model itself only enforces `min:0`),
  `availableDays` (optional array, no duplicates, each one of the 7 lowercase weekday names),
  `consultationTypes` (optional array, no duplicates, each `"vetConsultation"` or
  `"behaviorTraining"`). Returns the updated, populated profile (no `reviews` key on this response).
- `GET /` / `GET /:userId` — no role restriction (any authenticated user); not used by this phase
  beyond what's already wired for the adopter-facing directory.
- **No photo field on `VetProfile` itself** — the photo shown everywhere is `userId.profileImage`
  from the `User` model. Photo upload/replace/delete uses the generic, role-agnostic user-image
  endpoints already used by the Public Website's `ProfileImageManager`: `PATCH /user/profile/image`,
  `PATCH /user/profile/image/replace`, `DELETE /user/profile/image` — all already wrapped by
  `packages/api-client/src/user.ts`'s `uploadProfileImage`/`replaceProfileImage`/`deleteProfileImage`
  and `packages/hooks/src/user.ts`'s `createUserAccountHooks`, reusable as-is.
- **Confirmed data quirk**: `VetProfile.averageRating`/`totalReviews` are referenced by a Mongoose
  static (`Review.js`'s `calcAverageRating`) but **not declared on the `VetProfile` schema at all** —
  those writes are silently dropped (`strict: true` default). There is no reliable persisted rating
  field. The existing frontend type already marks these optional/unreliable; My Profile's review
  summary must be computed client-side from the embedded `reviews` array using the existing
  `getAverageRating` utility in `packages/utilities` (already documented there for exactly this
  reason — "used where the backend's own persisted averageRating/totalReviews fields are
  unreliable").

### Vet Appointments (`/api/v1/vetappointments`) — vet-side subset

- `GET /vet` — `[auth, role(["vet"])]`. Hard-scoped server-side to `{vetId: req.user.id}` — the
  scoping key is the vet's own **User id**, not a VetProfile id. Query params: `status` only (exact
  match, no enum validation on the param itself). No pagination, no search, no sort param — sort is
  hardcoded server-side (`appointmentDate` asc, then `createdAt` desc). Populates `adopterId`
  (`firstName lastName email phone profileImage`). Response: `{success, count, data}`.
- `PATCH /:id/schedule` — `[auth, role(["vet"])]`. Body: `{appointmentDate (ISO string, required),
  duration (int 15-180, optional, default 30), vetNotes (string ≤1000, optional)}`. **Only valid when
  current status is `"pending"`** (400 otherwise). Requires the date to be in the future (400
  otherwise). Checks for a scheduling conflict against the vet's other `scheduled` appointments
  (409 `"The vet already has another appointment during this time"` on overlap). On success:
  `appointmentDate`/`duration` set, `status → "scheduled"`, `vetNotes` set if provided.
- `PATCH /:id/status` — `[auth, role(["vet"])]`. Body: `{status: "completed"|"rejected" (required),
  vetNotes (optional, ≤1000), rejectionReason (required only when status is "rejected")}`. **Only
  valid when current status is `"scheduled"`** (400 otherwise — `pending` cannot go directly to
  completed/rejected). On `"completed"`: sets `completedAt`, clears `rejectionReason`. On
  `"rejected"`: sets `rejectionReason` (trimmed).
- `GET /:id` — `[auth, role(["adopter","vet","superadmin"])]`. Populates both `adopterId` and
  `vetId`. 403 unless the caller is the adopter, the assigned vet, or superadmin.
- **Full status enum**: `pending | scheduled | completed | rejected | cancelled`. Confirmed legal
  transitions actually implemented: `pending → scheduled` (vet, via `/schedule`); `pending →
  cancelled` / `scheduled → cancelled` (**adopter only**, via `/cancel` — not available to vet);
  `scheduled → completed` / `scheduled → rejected` (vet, via `/status`). No path exists from
  `pending` straight to `completed`/`rejected`, and nothing moves out of a terminal state. There is
  **no reschedule, no vet-initiated cancel, no no-show** endpoint — only schedule and the two
  status-completion outcomes exist.
- No animal reference, no shelter reference on this model at all — appointments are purely
  adopter↔vet.

### Reviews — deferred again this phase (per your decision)

Confirmed the backend fully supports vet reply (`PUT /reviews/:id/reply`, gated on
`review.targetType === "vet" && review.targetId === (the vet's own User id)` — simpler than
shelterEmployee's gate, no profile lookup or `isActive` check at all). No vet-scoped "list reviews
about me" endpoint exists beyond what's already embedded in `GET /vet-profile/me`'s `reviews` array.
**Per your decision, this phase does not build reply-to-review capability.** `/reviews` remains the
shared Phase 1 `ComingSoonPage` placeholder for both `shelterEmployee` and `vet`, untouched.

### Shelter attachment — informational only, no page

A vet's `VetProfile.shelterId` can be set (vets are added to a shelter's `employees[]` array exactly
like shelterEmployees, confirmed in `addEmployee`/`removeEmployee` — `role in
["shelterEmployee","vet"]`), but `GET /shelters/:id` has **no vet-specific branch at all** — a vet
hitting that route always falls to the plain public branch (or 404 if the shelter isn't currently
public), regardless of their actual affiliation. There is no benefit to building a "My Shelter" page
for vet; the affiliated shelter (if any) is shown only as a small read-only blurb on My Profile,
sourced entirely from the vet's own `GET /me` response (`shelterId.name`, no separate fetch).

### Notifications — no work needed

Already confirmed role-agnostic in Phase 1/2/3 discovery; nothing new required.

## Confirmed page scope (this phase)

1. **Vet Overview** — welcome header (existing pattern), appointment statistics, recent-appointments
   feed (derived from real data only), quick actions.
2. **My Profile** — fully editable: specialization, bio, experience years, available days (multi-
   select), consultation types (multi-select), profile photo (upload/replace/delete via the existing
   generic user-image endpoints), a read-only affiliated-shelter blurb (name + city, only if
   `shelterId` is set), and a read-only reviews summary (computed average + list, from the embedded
   `reviews` array).
3. **Appointments Management** — list with a status filter (server-side) + client-side search/sort/
   pagination, quick-view (list data only), schedule a pending request (date/time + duration +
   optional notes), mark a scheduled appointment completed (optional notes) or rejected (required
   reason).

Not in scope this phase: Reviews/reply-to-review (deferred, stays `ComingSoonPage`), a "My Shelter"
page for vet (no backend benefit — see above), rescheduling or vet-initiated cancellation (no such
endpoint exists).

## Navigation structure

No changes needed to `Sidebar.tsx`'s `navByRole.vet` (already: Overview, My Profile, Appointments,
Reviews) or `routes/paths.ts` (`vetProfile: "/vet-profile"`, `appointments: "/appointments"` already
reserved). `App.tsx`'s two `ComingSoonPage` routes under the `vet`-gated `<Route>` block get replaced
with real pages for `vet-profile` and `appointments`; the shared `reviews` route stays
`ComingSoonPage`, exactly as it does for `shelterEmployee`.

## Permissions

Vet is a flat, non-privileged role with respect to every endpoint in this phase — no
manager/employee-style tier exists for vets (`VetProfile` has no `position` field at all; that
concept is exclusive to `ShelterEmployeeProfile` and the two models are structurally mutually
exclusive per-user). No UI in this phase needs to gate on anything beyond "is this appointment
mine" / "is this the current status that allows this action" — both already enforced server-side and
mirrored client-side so no action is ever offered that would 400/403/409.

## API endpoint mapping

| Page | Endpoint | Notes |
|---|---|---|
| Overview | `GET /vet-profile/me` | resolve own profile (for stats/greeting context) |
| Overview | `GET /vetappointments/vet` | appointment stats + recent (client-derived) |
| My Profile | `GET /vet-profile/me` | full profile display |
| My Profile | `PUT /vet-profile/me` | edit specialization/bio/experience/availability/consultation types |
| My Profile | `PATCH /user/profile/image`, `PATCH /user/profile/image/replace`, `DELETE /user/profile/image` | photo management (already-wrapped generic endpoints, reused as-is) |
| Appointments | `GET /vetappointments/vet?status=` | server-side status filter; client-side search + sort + pagination (10/page) |
| Appointments | `PATCH /vetappointments/:id/schedule` | schedule a pending request |
| Appointments | `PATCH /vetappointments/:id/status` | complete or reject a scheduled appointment |

No server-side pagination or free-text search exists for vet appointments — handled client-side,
consistent with the pattern already approved in Phases 2-3.

## Nullable / populated field risks

- `VetProfile.shelterId` is `null` for an independent vet — My Profile's shelter blurb must be
  conditionally rendered, never assumed present.
- The existing `VetProfile`/`VetAppointment` frontend types already mark `userId`/`adopterId`/`vetId`
  populate refs as nullable (dangling-reference risk, the same class of bug confirmed for
  `AdminShelter.createdBy` in Phase 2) — for `GET /me` and `GET /vet` specifically this is
  practically unlikely (the caller's own linked User document necessarily exists), but the code must
  still handle the null case defensively rather than assume it away, since the type is nullable and
  TypeScript will require it.
- `VetProfile.bio`/`specialization` are nullable — the edit form must treat `null` as an empty
  starting value, not crash.
- `VetAppointment.rejectionReason` is nullable; `vetNotes`/`requestMessage` default to empty string
  (not null) per the schema — render accordingly.

## UI states

Loading/error/empty/success follow the exact Phase 2/3 conventions: `TableSkeleton`/`Spinner` while
loading, `ErrorState` with retry on failure, `EmptyState` when a filtered result set is empty,
success renders the real content. Appointments use the `Table` layout (data-dense: adopter, date,
status, actions), consistent with Adoption Requests' precedent rather than Animals' card-grid
precedent (appointments have no image to show).

## Modal and confirmation flows

- **Edit My Profile**: inline form on the page itself (not a modal) — mirrors how the Public
  Website's `AccountPage`/`AdopterProfilePage` edit their own profile in-place, not through a dialog,
  since there's no "row" context here, just a single self-record. Available days and consultation
  types are rendered as small groups of plain checkboxes (no existing shared checkbox/multi-select
  component, and this is the first place a multi-select array field is needed — a single-page, two-
  field use case doesn't justify a new shared component; follows YAGNI, matching how `"true"/"false"`
  single-select booleans were handled locally in Phase 3 rather than centralized).
- **Schedule Appointment**: `Modal` with a `datetime-local` `Input`, a duration `Input`
  (`type="number"`, 15-180), and an optional `Textarea` for notes — reuses the existing generic
  `Input` component (already a thin wrapper over a native `<input>`, so `type="datetime-local"`
  requires no new component).
- **Complete Appointment**: `Modal` with an optional notes `Textarea` — no reason required (mirrors
  Phase 2's Approve-style direct-with-optional-detail actions).
- **Reject Appointment**: `Modal` + required reason `Textarea`, mirroring `RejectAdoptionRequestDialog`
  exactly (same 1-1000-char-ish reason-required pattern, though this endpoint's reason field has no
  documented min-length — just non-empty-required, confirmed from the validation call).
- **Quick-view** (Appointment): read-only `Modal` built entirely from already-fetched list data — no
  additional API calls, matching the established principle.

## Responsive behavior

Same breakpoints and verification points as prior phases: 375px, 768px, 1024px, 1440px. My Profile's
edit form fields stack to one column below `sm`. Appointments' `Table` scrolls horizontally inside
its own container rather than overflowing the page.

## Shared-component reuse

Reused as-is: `Badge`, `Input`, `Select`, `Textarea`, `Button`, `Modal`, `Table` family,
`TableSkeleton`, `EmptyState`, `ErrorState`, `Spinner`, `Card`, `Container`, `UserAvatar`,
`IconBadge`, `QuickLinkCard`, `StatCard`, `ImageUploader` (already built in Phase 3 — reusable
as-is for the profile-photo flow, though note the existing generic profile-image endpoints are
single-file only, so `ImageUploader` is used here in its non-`multiple` mode), `Pagination`.

## New shared components needed

**None.** Every UI need this phase is covered by what Phases 1-3 already built. (Contrast with Phase
3, which needed a new `ImageUploader` — that gap is already closed.)

## New Dashboard-specific components (role-specific, stay in `apps/dashboard`)

`VetOverview`, a small `RecentAppointmentsFeed` (analogous to Phase 2/3's recent-activity feeds, not
shared with them — different semantics, kept separate per the same YAGNI reasoning used before),
`MyProfilePage` (single in-place edit form, not a modal), `AppointmentsPage` + `AppointmentsFilters`,
`AppointmentsTable`, `AppointmentQuickViewModal`, `ScheduleAppointmentDialog`,
`CompleteAppointmentDialog`, `RejectAppointmentDialog`.

## New data-layer additions needed (types / api-client / hooks / validation)

Following the exact separate-file convention established in Phases 2-3:

- **Types**: extend `vetProfile.ts` with an `UpdateVetProfilePayload` (the 5 whitelisted fields,
  all optional); extend `vetAppointment.ts` with `ScheduleVetAppointmentPayload` (`appointmentDate`,
  `duration?`, `vetNotes?`) and `UpdateVetAppointmentStatusPayload` (`status`, `vetNotes?`,
  `rejectionReason?`).
- **api-client**: new `vetProfileSelf.ts` (`getMyVetProfile`, `updateMyVetProfile` — kept apart from
  the existing adopter/public-facing `vetProfiles.ts`, which only has `getVets`/`getVetById`); new
  `vetAppointmentVet.ts` (`getVetAppointments` [the vet-scoped list], `scheduleVetAppointment`,
  `updateVetAppointmentStatus` — kept apart from the existing adopter-facing `vetAppointments.ts`).
  Photo management reuses the **existing** `packages/api-client/src/user.ts` functions unchanged —
  no new file needed there.
- **hooks**: new `createVetProfileSelfHooks` and `createVetAppointmentVetHooks` factories (separate
  from the existing `createVetProfileHooks`/`createVetAppointmentHooks`, same reasoning as every
  prior phase's split). Photo management reuses the **existing** `createUserAccountHooks` unchanged.
- **validation**: new `vetProfile.ts` zod schema (mirrors the backend's exact field constraints;
  `availableDays`/`consultationTypes` are arrays of checkboxes, not `"true"/"false"` selects, so they
  use `z.array(z.enum([...]))` directly, not the boolean-as-string convention used elsewhere); new
  `vetAppointmentVet.ts` holding three schemas — `scheduleAppointmentSchema` (date + duration +
  optional notes), `completeAppointmentSchema` (optional notes only), and `rejectAppointmentSchema`
  (required reason) — one file, three exports, mirroring the naming symmetry with the api-client
  file of the same name.

## Known backend limitations (carried into the implementation plan as constraints, not workarounds)

1. No reschedule, no vet-initiated cancellation, no no-show marking — the appointments UI only ever
   offers Schedule (from `pending`), Complete, or Reject (both from `scheduled`).
2. `VetProfile.averageRating`/`totalReviews` are not reliably persisted — My Profile computes its own
   rating summary client-side from the embedded `reviews` array, never trusting those two fields.
3. No free-text search or pagination exists server-side for `GET /vetappointments/vet` — both
   handled client-side, consistent with every prior phase's approach to the same gap.
4. A vet gets no elevated view of their affiliated shelter via `GET /shelters/:id` — no "My Shelter"
   page is built for this role; the affiliation is a read-only blurb sourced from the vet's own
   profile response only.

## Features explicitly excluded from this phase

- Reply-to-review capability (backend confirmed working, deferred per your decision — `/reviews`
  stays `ComingSoonPage`).
- A "My Shelter" page for vet (no backend benefit).
- Rescheduling, vet-initiated cancellation, or any status transition not in the confirmed list above.
- Any other role's pages or placeholders — nothing under `superadmin/`, `shelterEmployee/`, or the
  shared `ComingSoonPage` routes for `notifications`/`account` is touched.
