# Reviews Dashboard — Design Specification

Date: 2026-07-24
Status: Draft — awaiting approval before an implementation plan is written
Scope: Phase 5 — Reviews Dashboard, shared by `shelterEmployee` and `vet`

## Context

Dashboard Phases 1-4 (layout/auth/guards, Super Admin, Shelter Employee, Vet) are complete and
approved. Both Phase 3 and Phase 4 deliberately deferred Reviews (reply-to-review) and left the
shared `/reviews` route on `ComingSoonPage`. Phase 5 builds that page. This document is the output of
a fresh discovery pass over `src/routes/review.route.js`, `src/controllers/review.controller.js`,
`src/models/Review.js`, the relevant branches of `shelter.controller.js`/`vetProfile.controller.js`,
and the existing frontend (`packages/*`, `apps/public-web`, `apps/dashboard`).

Hard constraints restated: don't modify the backend; use only existing, confirmed endpoints; don't
invent routes/fields/permissions/behavior; reuse shared components before creating new ones; don't
create new shared UI components unless an actual implementation need appears; role-specific
components stay inside `apps/dashboard`; no new npm dependencies; preserve Phases 1-4 work exactly;
keep every other out-of-scope placeholder untouched.

## Confirmed capabilities

### Listing reviews — no new endpoint needed at all

There is no dedicated "list reviews for my shelter" or "list reviews for me as vet" endpoint. Both
already-built pages already fetch the exact data this phase needs:
- `MyShelterPage` (Phase 3) calls `shelterEmployeeShelterHooks.useMyShelterDetail(shelterId)` →
  `GET /shelters/:id`'s `shelterEmployee` accessLevel branch — **confirmed this response already
  includes a `reviews` array** (via the same `getShelterReviews` helper the superadmin branch uses,
  filtered to `status: "published"`, sorted newest-first). The frontend's
  `ShelterEmployeeShelterDetail` type simply never modeled this field (a gap from Phase 3, not a
  backend limitation) — this phase adds `reviews: Review[]` to that type (one line; `Review` is
  already imported in `shelter.ts`).
- `MyProfilePage` (Phase 4) calls `vetProfileSelfHooks.useMyVetProfile()` → `GET /vet-profile/me`,
  whose `reviews` array is already fully modeled on the `VetProfile` type (also `status: "published"`
  only, same filter).

Both mechanisms return the exact same `Review` shape (`_id, adopterId, rating, comment, reply,
isEdited, createdAt, updatedAt`) — one shared rendering path covers both roles. Neither supports
pagination or a status query param; both are always `status: "published"` (see below).

### Reply — the one real write endpoint

- `PUT /reviews/:id/reply` — `[auth, role(["shelterEmployee", "vet"])]`. Body: `{text}` (required,
  non-empty; validated at the express-validator layer up to 1000 chars, but the `Review` model's
  `reply.text` field caps at **500** — see the confirmed mismatch below). 404 `"Review not found"` if
  missing. **409 `"An official reply has already been added"` if `review.reply.text` is already
  set** — checked before any role branching, so this applies identically to both roles.
- **Gating differs by role** (re-confirmed at current line numbers):
  - `vet`: `review.targetType === "vet"` AND `review.targetId` equals the vet's own User `_id` —
    direct equality check, no `VetProfile` lookup at all.
  - `shelterEmployee`: `review.targetType === "shelter"` AND an active `ShelterEmployeeProfile`
    document with `{userId, shelterId: review.targetId, isActive: true}` — a real DB lookup, unlike
    vet's simple equality check.
- **A reply is permanent once added — confirmed no edit or delete path exists anywhere** (read the
  full `addReply` function and the whole route file; no second route, no update-reply branch). The
  UI must never offer to edit or delete an existing reply.
- **Confirmed mismatch, avoided defensively**: the backend's express-validator allows up to 1000
  characters, but `Review.reply.text`'s schema `maxlength` is 500. A reply between 501-1000 chars
  would pass validation, then throw an uncaught Mongoose `ValidationError` on `.save()`, which
  `asyncHandler` forwards to the generic error handler's `ValidationError` branch — a 400 with a raw,
  un-friendly Mongoose message (not the backend's own custom error). This phase's client-side zod
  schema caps reply text at **500**, not 1000, to make this backend inconsistency unreachable from
  the UI — the exact same defensive pattern already used by the existing adopter-facing
  `reviewFormSchema` for its `comment` field (documented there for the identical reason).

### Moderation status — confirmed dead code, not a concern

`Review.status` has enum values `["published", "reported", "hidden"]`, but **no endpoint anywhere
(superadmin or otherwise) ever sets `"reported"` or `"hidden"`** — confirmed via an exhaustive search
of `src/routes` and `src/controllers`. Every review is always `"published"` in practice. This phase
builds no moderation UI and needs none — the reviews this page ever sees are unconditionally the
full, real set for that shelter/vet.

### Route guard gap found and fixed as part of this phase

`/reviews` currently sits as a **sibling** to the `shelterEmployee`-only and `vet`-only `<Route>`
blocks in `App.tsx`, guarded only by the outer `DASHBOARD_ROLES` check (`shelterEmployee`, `vet`,
`superadmin`) — meaning a `superadmin` signed in today would also see the `ComingSoonPage` at
`/reviews`, since nothing currently excludes them. This wasn't consequential while the page was a
placeholder, but wiring the real page in the same spot without fixing this would let `superadmin`
reach a page with no real purpose for them (they have no shelter or vet profile to resolve identity
from). This phase wraps the real route in `<Route element={<RequireRole
roles={["shelterEmployee","vet"]} redirectTo={paths.home} />}>`, matching the exact pattern already
used for every other role-scoped route block — a `superadmin` visiting `/reviews` will be redirected
to their own Overview, same as visiting any other role's exclusive route today.

## Confirmed page scope (this phase)

One shared page, **Reviews**, at the existing `/reviews` route:
- Welcome/header consistent with every other Dashboard page.
- A client-side status filter: All / Needs reply / Replied.
- A list of reviews (rating, comment, existing reply if any) reusing the promoted `ReviewsSection`
  component (see below), extended with a "Reply" action on cards that don't have one yet.
- A Reply dialog (Modal + required Textarea, capped at 500 chars) — mirrors the exact
  `RejectShelterDialog`/`RejectAdoptionRequestDialog`/`RejectAppointmentDialog` pattern from every
  prior phase.
- Identity resolution branches by role internally: `shelterEmployee` resolves `shelterId` via
  `shelterEmployeeProfileHooks.useMyShelterEmployeeProfile()` then fetches
  `shelterEmployeeShelterHooks.useMyShelterDetail(shelterId)` (the same two-step chain
  `MyShelterPage` already uses); `vet` calls `vetProfileSelfHooks.useMyVetProfile()` directly
  (no separate id-lookup needed, matching `MyProfilePage`'s pattern).

Not in scope: any moderation capability (dead code, confirmed above), editing or deleting an existing
reply (no such endpoint exists), a "reviews I haven't seen yet" unread-tracking feature (no backend
concept of read/unread reviews exists).

## Navigation structure

No changes needed to `Sidebar.tsx` (both `navByRole.shelterEmployee` and `navByRole.vet` already
point their "Reviews" entry at `paths.reviews`). `routes/paths.ts` needs no change (`reviews:
"/reviews"` already reserved). `App.tsx`'s `/reviews` route swaps `ComingSoonPage` for the real page
and gains the `RequireRole roles={["shelterEmployee","vet"]}` wrapper described above — the only
structural routing change this phase makes.

## Permissions

Flat for both roles with respect to this page — the only gate is "does this review belong to my
shelter / am I this review's vet," already enforced server-side and mirrored client-side (the Reply
button/dialog is simply never offered for a review that isn't the current user's to reply to, since
the page only ever loads reviews for the current user's own shelter/vet identity in the first place —
there's no cross-target browsing in this design).

## API endpoint mapping

| Page | Endpoint | Notes |
|---|---|---|
| Reviews (shelterEmployee) | `GET /shelter-employee-profile/me` | resolve own shelter id (reused hook, no new call) |
| Reviews (shelterEmployee) | `GET /shelters/:id` | embedded `reviews` array (reused hook, no new call) |
| Reviews (vet) | `GET /vet-profile/me` | embedded `reviews` array (reused hook, no new call) |
| Reviews (both) | `PUT /reviews/:id/reply` | the one new endpoint this phase wires up |

## Nullable / populated field risks

- `Review.adopterId` (`ReviewAuthor`) — confirmed always populated with `firstName lastName
  profileImage` by both `getShelterReviews` and `getVetReviews`; `profileImage` itself is optional/
  nullable per `ImageRef | null`, already handled by the existing `UserAvatar`/display patterns.
- `Review.comment` can be an empty string (schema default `""`, not `null`) — render conditionally on
  truthiness, matching `ReviewsSection`'s existing `{review.comment && (...)}` pattern exactly.
- `Review.reply` is `null` until replied, then permanently set — this is the core branching condition
  for the whole page (drives the filter and the per-card action).
- `ShelterEmployeeProfile.shelterId` can be `null` (employee not yet assigned) — reuses the exact
  same "You're not assigned to a shelter yet" empty state already built into `MyShelterPage`/
  `AnimalsPage`/etc.

## UI states

Loading/error/empty/success follow the exact conventions from Phases 2-4: `Spinner` while resolving
identity, `ErrorState` with retry on failure, `EmptyState` when the filtered list is empty (distinct
copy for "no reviews at all" vs. "no reviews match this filter"), success renders the list. The Reply
dialog shows its own pending/error state exactly like every prior reason-required dialog.

## Modal and confirmation flows

- **Reply to review**: `Modal` + required `Textarea` (mirrors `RejectShelterDialog` exactly) — no
  confirmation step beyond the form itself, since replying isn't destructive. On success, the review
  card immediately reflects the new reply (via query invalidation) and the Reply action disappears
  for that card, matching the backend's one-reply-forever rule.
- No other dialogs — there's nothing else to confirm on this page.

## Responsive behavior

Same breakpoints as every prior phase: 375px, 768px, 1024px, 1440px. The promoted `ReviewsSection`'s
existing card-list layout (single column, no grid) already reads well at every width without change.

## Shared-component reuse

Reused as-is: `Badge`, `Textarea`, `Button`, `Modal`, `Select`, `EmptyState`, `ErrorState`, `Spinner`,
`getApiErrorMessage`, `getAverageRating`. **Promoted from `apps/public-web` into `packages/ui`** (per
your confirmation): `ReviewsSection`, extended with one optional, backward-compatible
`renderAction?: (review: Review) => ReactNode` prop — public-web's two existing usages
(`ShelterDetailPage`, `VeterinarianDetailPage`) are visually unchanged since neither passes it.

## New shared components needed

None beyond the `ReviewsSection` promotion above — that's a reuse move, not a new component.

## New Dashboard-specific components (role-specific, stay in `apps/dashboard`)

`ReviewsPage` (the one shared page, branching internally by role for identity resolution only — one
file, not duplicated per role, since the rendering is identical once a `Review[]` is in hand),
`ReviewsFilters` (All / Needs reply / Replied), `ReplyToReviewDialog`.

## New data-layer additions needed (types / api-client / hooks / validation)

Following the exact separate-file convention established in Phases 2-4:

- **Types**: add `reviews: Review[]` to `ShelterEmployeeShelterDetail` in `packages/types/src/
  shelter.ts` (fills the Phase 3 modeling gap found above; `Review` is already imported there). No
  other type changes needed — `VetProfile.reviews` already exists;
  `ReviewReplyInfo`/`ReviewAuthor`/`Review` already model everything the reply response needs.
- **api-client**: new `reviewReply.ts` (`replyToReview(client, id, text): Promise<Review>` — kept
  separate from the existing adopter-facing `reviews.ts`, whose header comment already documents the
  reply route as "shelterEmployee/vet-only and out of scope for this site").
- **hooks**: new `createReviewReplyHooks` factory exposing `useReplyToReview()`. On success it
  invalidates both `["shelters", "employee-detail"]` and `["vetProfile", "me"]` prefixes
  unconditionally (harmless no-op for whichever one isn't the active query — matches the existing
  adopter-facing `reviews.ts` hooks file's own precedent of invalidating multiple prefixes at once).
- **validation**: new `reviewReply.ts` zod schema (`text`, required, capped at 500 — the defensive
  choice explained above, not the backend's looser 1000-char validator limit).

## Known backend limitations (carried into the implementation plan as constraints, not workarounds)

1. No dedicated review-listing endpoint for either role — both reuse an already-fetched embedded
   array from an existing page's data source, confirmed to already contain everything needed.
2. No pagination or server-side filtering exists for either listing mechanism — the confirmed
   "Needs reply / Replied / All" filter is entirely client-side.
3. A reply cannot be edited or deleted once submitted — the UI must never suggest otherwise.
4. The backend's reply-length validation (1000) is looser than the model's real cap (500) — this
   phase's form caps at 500 to avoid ever hitting that inconsistency, not because the backend
   enforces 500 at the validation layer.

## Features explicitly excluded from this phase

- Any review moderation (report/hide/delete) — confirmed dead code, no endpoint exists.
- Editing or deleting an existing reply.
- Any change to `/vet-profile`, `/shelter`, or any other already-built page beyond the one-line
  `ShelterEmployeeShelterDetail` type addition needed to model data the backend already returns.
