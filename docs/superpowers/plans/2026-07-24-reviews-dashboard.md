# Reviews Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the one shared Reviews page (for `shelterEmployee` and `vet`) per the approved design
(`docs/superpowers/specs/2026-07-24-reviews-dashboard-design.md`), reusing the reviews data both
roles' existing pages already fetch, adding only the Reply mutation, and promoting the existing
`ReviewsSection` component from `apps/public-web` into shared `packages/ui`.

**Architecture:** No new listing endpoint is wired — this phase reuses `shelterEmployeeShelterHooks.
useMyShelterDetail`/`vetProfileSelfHooks.useMyVetProfile` (both already built in Phases 3-4) as the
data source, filling one type-modeling gap found during discovery (`ShelterEmployeeShelterDetail` was
missing a `reviews` field the backend always returns). The only new write is a Reply mutation, in a
new separate-file pair (api-client + hooks) mirroring every prior phase's role-scoped-file
convention. `ReviewsSection` is promoted from `apps/public-web` to `packages/ui` with one additive,
backward-compatible prop, and public-web's two consumers are repointed at the shared import with the
old local file removed.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Framer Motion, TanStack Query v5, React Hook
Form + Zod, React Router v7 — all already in place; no new dependencies.

**Verification approach:** No test framework exists in this repo (confirmed in every prior phase's
plan). Each task ends with a typecheck checkpoint; a full manual verification pass closes the plan,
including an explicit check that promoting `ReviewsSection` didn't change the Public Website's
rendered output.

**Two small, justified additions beyond the spec's literal file list, found while working out
`ReviewsPage`'s exact data-fetching:** `shelterEmployeeProfileHooks.useMyShelterEmployeeProfile()` and
`vetProfileSelfHooks.useMyVetProfile()` (both built in Phases 3-4) take no `enabled` option today.
Since `ReviewsPage` is one shared component that must call the shelterEmployee-side profile lookup
only when the signed-in user is a shelterEmployee (and the vet-side lookup only for a vet), calling
either unconditionally would fire a doomed `404`-returning request for the other role every time
either role visits this page. Both hooks already follow the exact `{enabled?: boolean}` pattern
used elsewhere (`useAnimals`, `useVet`) — this plan adds that same optional parameter to these two,
fully backward compatible (every existing call site keeps calling them with no arguments, defaulting
to `enabled: true`, unchanged behavior).

---

## Backend endpoint used (pre-existing, not modified)

| Endpoint | Method | Used for |
|---|---|---|
| `PUT /reviews/:id/reply` | PUT | The only new write this phase wires up. Body `{text}`, 404 if missing, 409 if already replied, 403 on role/ownership mismatch — all surfaced verbatim, never re-validated client-side beyond the 500-char cap explained below. |

No other endpoint is called that isn't already wired by a prior phase (`GET /shelter-employee-profile/
me`, `GET /shelters/:id`, `GET /vet-profile/me` — all reused via their existing hooks, zero new
network surface for reads). No endpoint is invented. No backend file is modified.

---

## File inventory

**Modified — types:**
- `frontend/packages/types/src/shelter.ts` (add `reviews: Review[]` to `ShelterEmployeeShelterDetail`)

**New — data layer (validation, api-client, hooks):**
- `frontend/packages/validation/src/reviewReply.ts` (new)
- `frontend/packages/validation/src/index.ts` (modified)
- `frontend/packages/api-client/src/reviewReply.ts` (new)
- `frontend/packages/api-client/src/index.ts` (modified)
- `frontend/packages/hooks/src/reviewReply.ts` (new)
- `frontend/packages/hooks/src/index.ts` (modified)
- `frontend/packages/hooks/src/shelterEmployeeProfile.ts` (modified — add optional `enabled`)
- `frontend/packages/hooks/src/vetProfileSelf.ts` (modified — add optional `enabled` to `useMyVetProfile`)

**New — Dashboard lib wiring:**
- `frontend/apps/dashboard/src/lib/reviewReplyHooks.ts` (new)

**Promoted shared component:**
- `frontend/packages/ui/src/ReviewsSection.tsx` (new — promoted from public-web, extended with
  `renderAction`)
- `frontend/packages/ui/src/index.ts` (modified)
- `frontend/apps/public-web/src/components/ReviewsSection.tsx` (deleted)
- `frontend/apps/public-web/src/pages/shelters/ShelterDetailPage.tsx` (modified — import path only)
- `frontend/apps/public-web/src/pages/veterinarians/VeterinarianDetailPage.tsx` (modified — import
  path only)

**New — Dashboard Reviews page:**
- `frontend/apps/dashboard/src/pages/reviews/components/ReviewsFilters.tsx` (new)
- `frontend/apps/dashboard/src/pages/reviews/components/ReplyToReviewDialog.tsx` (new)
- `frontend/apps/dashboard/src/pages/reviews/ReviewsPage.tsx` (new)

**Modified — routing:**
- `frontend/apps/dashboard/src/App.tsx` (modified — real page + `RequireRole` fix for `/reviews`)

No file outside `frontend/` is touched. No backend file is touched.

---

## Task 1: Types

**Files:**
- Modify: `frontend/packages/types/src/shelter.ts`

- [ ] **Step 1: Add `reviews` to `ShelterEmployeeShelterDetail`**

In `frontend/packages/types/src/shelter.ts`, change:
```ts
export interface ShelterEmployeeShelterDetail extends AdminShelter {
  employees: (ShelterTeamMemberRef | null)[];
}
```
to:
```ts
export interface ShelterEmployeeShelterDetail extends AdminShelter {
  employees: (ShelterTeamMemberRef | null)[];
  /**
   * GET /shelters/:id's shelterEmployee accessLevel branch always includes
   * this (via the same getShelterReviews helper the superadmin branch uses,
   * filtered to status:"published") — this type simply never modeled it
   * until now. `Review` is already imported at the top of this file.
   */
  reviews: Review[];
}
```

`Review` is already imported in this file (`import type { Review } from "./review";`, used by
`AuthedShelterDetail` above) — no new import needed.

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/types`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/packages/types/src/shelter.ts
git commit -m "feat(types): model the reviews array GET /shelters/:id already returns for shelterEmployee"
```

---

## Task 2: Reply validation schema

**Files:**
- Create: `frontend/packages/validation/src/reviewReply.ts`
- Modify: `frontend/packages/validation/src/index.ts`

- [ ] **Step 1: Create the schema**

```ts
/**
 * Zod schema for the shelterEmployee/vet reply-to-review form. Caps at 500
 * characters — not the backend's looser 1000-char express-validator limit.
 * The Review model's reply.text schema field caps at 500; a reply between
 * 501-1000 chars would pass validation then throw an uncaught Mongoose
 * ValidationError on save (surfaced as a raw 400, not a clean custom
 * error). Capping here at the model's real limit makes that inconsistency
 * unreachable from this form — same defensive pattern already used by the
 * existing adopter-facing reviewFormSchema's comment field.
 */
import { z } from "zod";

export const reviewReplySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "A reply is required")
    .max(500, "Reply cannot exceed 500 characters"),
});

export type ReviewReplyFormValues = z.infer<typeof reviewReplySchema>;
```

- [ ] **Step 2: Export it**

Add to `frontend/packages/validation/src/index.ts` (after `export * from "./vetAppointmentVet";`):
```ts
export * from "./reviewReply";
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/validation`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/packages/validation/src/reviewReply.ts frontend/packages/validation/src/index.ts
git commit -m "feat(validation): add reply-to-review schema"
```

---

## Task 3: Reply api-client function

**Files:**
- Create: `frontend/packages/api-client/src/reviewReply.ts`
- Modify: `frontend/packages/api-client/src/index.ts`

- [ ] **Step 1: Create the function**

```ts
/**
 * Shelter-employee/vet endpoint function for PUT /reviews/:id/reply. Kept
 * separate from ./reviews.ts, which is documented there as the adopter-
 * facing subset only (that file's header comment already flags this exact
 * route as "shelterEmployee/vet-only and out of scope for this site").
 */
import type { AxiosInstance } from "axios";
import type { Review } from "@paw-match/types";

/**
 * PUT /reviews/:id/reply — 404 if the review doesn't exist; 409 if it
 * already has a reply (only one reply is ever allowed — no edit/delete path
 * exists anywhere on the backend). Gating differs by role server-side (vet:
 * targetType "vet" + targetId === own user id; shelterEmployee: targetType
 * "shelter" + an active ShelterEmployeeProfile linked to that shelter) —
 * both surface as 403 on mismatch, never re-validated client-side.
 */
export const replyToReview = async (
  client: AxiosInstance,
  id: string,
  text: string,
): Promise<Review> => {
  const { data } = await client.put<{ success: true; message: string; data: Review }>(
    `/reviews/${id}/reply`,
    { text },
  );
  return data.data;
};
```

- [ ] **Step 2: Export it**

Add to `frontend/packages/api-client/src/index.ts` (after `export * from "./vetAppointmentVet";`):
```ts
export * from "./reviewReply";
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/api-client`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/packages/api-client/src/reviewReply.ts frontend/packages/api-client/src/index.ts
git commit -m "feat(api-client): add reply-to-review endpoint"
```

---

## Task 4: Reply hook + `enabled` guards on two existing profile hooks

**Files:**
- Create: `frontend/packages/hooks/src/reviewReply.ts`
- Modify: `frontend/packages/hooks/src/index.ts`
- Modify: `frontend/packages/hooks/src/shelterEmployeeProfile.ts`
- Modify: `frontend/packages/hooks/src/vetProfileSelf.ts`
- Create: `frontend/apps/dashboard/src/lib/reviewReplyHooks.ts`

- [ ] **Step 1: Create `packages/hooks/src/reviewReply.ts`**

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { replyToReview } from "@paw-match/api-client";

/**
 * Mutation hook for the shelterEmployee/vet reply-to-review action.
 * Invalidates both the shelter-detail and vet-profile-self query prefixes
 * unconditionally on success — a harmless no-op for whichever one isn't the
 * caller's active query, same precedent as the existing adopter-facing
 * reviews hooks file's own multi-prefix invalidation on review create/update.
 */
export const createReviewReplyHooks = (client: AxiosInstance) => {
  const useReplyToReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, text }: { id: string; text: string }) => replyToReview(client, id, text),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["shelters", "employee-detail"] });
        queryClient.invalidateQueries({ queryKey: ["vetProfile", "me"] });
      },
    });
  };

  return { useReplyToReview };
};
```

- [ ] **Step 2: Add an `enabled` option to `useMyShelterEmployeeProfile`**

In `frontend/packages/hooks/src/shelterEmployeeProfile.ts`, change:
```ts
export const createShelterEmployeeProfileHooks = (client: AxiosInstance) => {
  const useMyShelterEmployeeProfile = () =>
    useQuery({
      queryKey: ["shelterEmployeeProfile", "me"],
      queryFn: () => getMyShelterEmployeeProfile(client),
    });

  return { useMyShelterEmployeeProfile };
};
```
to:
```ts
export const createShelterEmployeeProfileHooks = (client: AxiosInstance) => {
  /** Pass `enabled: false` when the caller isn't a shelterEmployee (e.g. the shared Reviews page). */
  const useMyShelterEmployeeProfile = (options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: ["shelterEmployeeProfile", "me"],
      queryFn: () => getMyShelterEmployeeProfile(client),
      enabled: options.enabled ?? true,
    });

  return { useMyShelterEmployeeProfile };
};
```

This is fully backward compatible — every existing call site (`ShelterEmployeeOverview`,
`MyShelterPage`, `ShelterEmployeesPage`, `AnimalsPage`, `AdoptionRequestsPage`) calls
`useMyShelterEmployeeProfile()` with no arguments, defaulting to `enabled: true`, unchanged.

- [ ] **Step 3: Add an `enabled` option to `useMyVetProfile`**

In `frontend/packages/hooks/src/vetProfileSelf.ts`, change:
```ts
  const useMyVetProfile = () =>
    useQuery({
      queryKey: ["vetProfile", "me"],
      queryFn: () => getMyVetProfile(client),
    });
```
to:
```ts
  /** Pass `enabled: false` when the caller isn't a vet (e.g. the shared Reviews page). */
  const useMyVetProfile = (options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: ["vetProfile", "me"],
      queryFn: () => getMyVetProfile(client),
      enabled: options.enabled ?? true,
    });
```

Also backward compatible — the only existing call sites (`VetOverview`, `MyProfilePage`) call
`useMyVetProfile()` with no arguments, unchanged.

- [ ] **Step 4: Export the new hook**

Add to `frontend/packages/hooks/src/index.ts` (after `export * from "./vetAppointmentVet";`):
```ts
export * from "./reviewReply";
```

- [ ] **Step 5: Wire into the Dashboard app**

Create `frontend/apps/dashboard/src/lib/reviewReplyHooks.ts`:
```ts
import { createReviewReplyHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const reviewReplyHooks = createReviewReplyHooks(apiClient);
```

- [ ] **Step 6: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/hooks && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/packages/hooks/src/reviewReply.ts frontend/packages/hooks/src/index.ts frontend/packages/hooks/src/shelterEmployeeProfile.ts frontend/packages/hooks/src/vetProfileSelf.ts frontend/apps/dashboard/src/lib/reviewReplyHooks.ts
git commit -m "feat(hooks): add reply-to-review mutation and enabled guards on the two profile-self hooks"
```

---

## Task 5: Promote `ReviewsSection` into `packages/ui`

**Files:**
- Create: `frontend/packages/ui/src/ReviewsSection.tsx`
- Modify: `frontend/packages/ui/src/index.ts`
- Delete: `frontend/apps/public-web/src/components/ReviewsSection.tsx`
- Modify: `frontend/apps/public-web/src/pages/shelters/ShelterDetailPage.tsx`
- Modify: `frontend/apps/public-web/src/pages/veterinarians/VeterinarianDetailPage.tsx`

- [ ] **Step 1: Create the promoted component**

This is the exact current contents of `apps/public-web/src/components/ReviewsSection.tsx`, with one
additive prop (`renderAction`) and its rendering, plus a doc-comment update noting the Dashboard as a
third consumer. Nothing else changes — every existing visual element, class, and prop is identical.

```tsx
import type { ReactNode } from "react";
import { Star } from "lucide-react";
import type { Review } from "@paw-match/types";
import { getAverageRating } from "@paw-match/utilities";

export interface ReviewsSectionProps {
  reviews: Review[];
  emptyMessage: string;
  replyLabel: string;
  /** Optional per-review action slot (e.g. a "Reply" button) — rendered inside each review card. Callers decide when to render anything (e.g. only for reviews without a reply yet). */
  renderAction?: (review: Review) => ReactNode;
}

/**
 * Shared by the Public Website's shelter/vet detail pages and the
 * Dashboard's Reviews page — all consume the identical Review[] shape. The
 * backend's own averageRating/totalReviews fields are never actually
 * persisted (Shelter and VetProfile schemas don't declare them, so
 * Review.calcAverageRating's $set is silently dropped by Mongoose's strict
 * mode) — so the average shown here is computed directly from the real
 * reviews already returned, not read from those broken fields.
 */
export const ReviewsSection = ({ reviews, emptyMessage, replyLabel, renderAction }: ReviewsSectionProps) => {
  const averageRating = getAverageRating(reviews);

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
        {typeof averageRating === "number" && (
          <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
            {averageRating.toFixed(1)}
            <span className="text-slate-500">({reviews.length})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {reviews.map((review) => (
            <li key={review._id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">
                  {review.adopterId.firstName} {review.adopterId.lastName}
                </span>
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                  {review.rating}
                </span>
              </div>
              {review.comment && <p className="mt-2 text-sm text-slate-600">{review.comment}</p>}
              {review.reply && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-700">{replyLabel}</p>
                  <p className="mt-1">{review.reply.text}</p>
                </div>
              )}
              {renderAction && <div className="mt-3">{renderAction(review)}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Export it**

Add to `frontend/packages/ui/src/index.ts` (after `export * from "./ImageUploader";`):
```ts
export * from "./ReviewsSection";
```

- [ ] **Step 3: Repoint the Public Website's two consumers**

In `frontend/apps/public-web/src/pages/shelters/ShelterDetailPage.tsx`, change:
```ts
import { ReviewsSection } from "../../components/ReviewsSection";
```
to:
```ts
import { ReviewsSection } from "@paw-match/ui";
```
(Move this import line to wherever this file's existing `@paw-match/ui` import group is, if one
already exists, to match the codebase's import-grouping convention — otherwise leave it in place.)

In `frontend/apps/public-web/src/pages/veterinarians/VeterinarianDetailPage.tsx`, make the identical
change:
```ts
import { ReviewsSection } from "../../components/ReviewsSection";
```
to:
```ts
import { ReviewsSection } from "@paw-match/ui";
```

Neither file's actual `<ReviewsSection ... />` usage (props passed) needs to change — only the
import source. Since `renderAction` is optional and neither call site passes it, both continue to
render byte-for-byte identically to before.

- [ ] **Step 4: Delete the old local file**

Delete `frontend/apps/public-web/src/components/ReviewsSection.tsx` — confirm no other file still
imports from `"../../components/ReviewsSection"` or `"./components/ReviewsSection"` anywhere in
`apps/public-web/src` before deleting (the earlier discovery search found exactly the two consumers
listed above and no others).

- [ ] **Step 5: Typecheck both apps**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/ui && npm run typecheck --workspace=@paw-match/public-web`
Expected: no errors. (A typecheck failure here would mean a third, previously-unfound consumer of
the old local file still exists — if so, repoint it the same way before proceeding.)

- [ ] **Step 6: Commit**

```bash
git add frontend/packages/ui/src/ReviewsSection.tsx frontend/packages/ui/src/index.ts frontend/apps/public-web/src/components/ReviewsSection.tsx frontend/apps/public-web/src/pages/shelters/ShelterDetailPage.tsx frontend/apps/public-web/src/pages/veterinarians/VeterinarianDetailPage.tsx
git commit -m "refactor(ui): promote ReviewsSection from public-web into shared packages/ui"
```

---

## Task 6: Reviews page

**Files:**
- Create: `frontend/apps/dashboard/src/pages/reviews/components/ReviewsFilters.tsx`
- Create: `frontend/apps/dashboard/src/pages/reviews/components/ReplyToReviewDialog.tsx`
- Create: `frontend/apps/dashboard/src/pages/reviews/ReviewsPage.tsx`

- [ ] **Step 1: Create `ReviewsFilters.tsx`**

```tsx
import { Select } from "@paw-match/ui";

export type ReviewsFilterValue = "all" | "needsReply" | "replied";

export interface ReviewsFiltersProps {
  value: ReviewsFilterValue;
  onChange: (value: ReviewsFilterValue) => void;
}

const filterOptions: { label: string; value: ReviewsFilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Needs reply", value: "needsReply" },
  { label: "Replied", value: "replied" },
];

/** Entirely client-side — neither review-listing mechanism (embedded in GET /shelters/:id or GET /vet-profile/me) supports server-side filtering. */
export const ReviewsFilters = ({ value, onChange }: ReviewsFiltersProps) => (
  <div className="max-w-xs">
    <Select
      label="Filter reviews"
      hideLabel
      options={filterOptions}
      value={value}
      onChange={(event) => onChange(event.target.value as ReviewsFilterValue)}
    />
  </div>
);
```

- [ ] **Step 2: Create `ReplyToReviewDialog.tsx`**

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { reviewReplySchema } from "@paw-match/validation";
import type { ReviewReplyFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { Review } from "@paw-match/types";
import { reviewReplyHooks } from "../../../lib/reviewReplyHooks";

export interface ReplyToReviewDialogProps {
  review: Review | null;
  replyLabel: string;
  onClose: () => void;
}

/**
 * Only ever opened for a review with no reply yet (ReviewsPage only offers
 * the "Reply" action on cards without one). The backend rejects a second
 * reply with 409 "An official reply has already been added" — that message
 * is already friendly, so it's surfaced verbatim via getApiErrorMessage with
 * no special-casing, exactly like every other mutation error in this app.
 */
export const ReplyToReviewDialog = ({ review, replyLabel, onClose }: ReplyToReviewDialogProps) => {
  const replyMutation = reviewReplyHooks.useReplyToReview();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewReplyFormValues>({ resolver: zodResolver(reviewReplySchema) });

  useEffect(() => {
    if (review) reset({ text: "" });
  }, [review, reset]);

  const onSubmit = (values: ReviewReplyFormValues) => {
    if (!review) return;
    replyMutation.mutate({ id: review._id, text: values.text }, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(review)}
      onClose={onClose}
      title={
        review ? `Reply to ${review.adopterId.firstName} ${review.adopterId.lastName}` : "Reply to review"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={replyMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={replyMutation.isPending}>
            {replyLabel}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {review?.comment && (
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Their review</p>
            <p className="mt-1 text-sm text-slate-700">{review.comment}</p>
          </div>
        )}
        <Textarea label="Your reply" rows={4} error={errors.text?.message} {...register("text")} />
        {replyMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(replyMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
```

- [ ] **Step 3: Create `ReviewsPage.tsx`**

```tsx
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button, EmptyState, ErrorState, ReviewsSection, Spinner } from "@paw-match/ui";
import type { Review } from "@paw-match/types";
import { useAuth } from "../../lib/auth";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { shelterEmployeeShelterHooks } from "../../lib/shelterEmployeeShelterHooks";
import { vetProfileSelfHooks } from "../../lib/vetProfileSelfHooks";
import { ReviewsFilters } from "./components/ReviewsFilters";
import type { ReviewsFilterValue } from "./components/ReviewsFilters";
import { ReplyToReviewDialog } from "./components/ReplyToReviewDialog";

/**
 * One shared page for both shelterEmployee and vet — the rendering is
 * identical once a Review[] is in hand, so this only branches for identity
 * resolution: shelterEmployee needs a shelterId lookup first (same two-step
 * chain MyShelterPage already uses), vet resolves directly from the token
 * (same as MyProfilePage). Neither role's profile hook fires for the other
 * role, avoiding a doomed 404 request every time either role visits this
 * page.
 */
const ReviewsPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const auth = useAuth();
  const role = auth.user?.role;
  const isShelterEmployee = role === "shelterEmployee";
  const isVet = role === "vet";

  const [filter, setFilter] = useState<ReviewsFilterValue>("all");
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);

  const shelterEmployeeProfileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile({
    enabled: isShelterEmployee,
  });
  const shelterId = shelterEmployeeProfileQuery.data?.shelterId?._id;
  const shelterDetailQuery = shelterEmployeeShelterHooks.useMyShelterDetail(
    isShelterEmployee ? shelterId : undefined,
  );

  const vetProfileQuery = vetProfileSelfHooks.useMyVetProfile({ enabled: isVet });

  const replyLabel = isShelterEmployee ? "Shelter reply" : "Vet reply";

  const reviews: Review[] | undefined = isShelterEmployee
    ? shelterDetailQuery.data?.reviews
    : isVet
      ? vetProfileQuery.data?.reviews
      : undefined;

  const filteredReviews = useMemo(() => {
    const list = reviews ?? [];
    if (filter === "needsReply") return list.filter((review) => !review.reply);
    if (filter === "replied") return list.filter((review) => Boolean(review.reply));
    return list;
  }, [reviews, filter]);

  if (isShelterEmployee && shelterEmployeeProfileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (isShelterEmployee && shelterEmployeeProfileQuery.isError) {
    return (
      <ErrorState title="Couldn't load your profile" onRetry={() => shelterEmployeeProfileQuery.refetch()} />
    );
  }

  if (isShelterEmployee && !shelterId) {
    return (
      <EmptyState
        title="You're not assigned to a shelter yet"
        description="Contact your administrator to be added to a shelter."
      />
    );
  }

  const isLoading = isShelterEmployee ? shelterDetailQuery.isLoading : vetProfileQuery.isLoading;
  const isError = isShelterEmployee ? shelterDetailQuery.isError : vetProfileQuery.isError;
  const handleRetry = isShelterEmployee
    ? () => shelterDetailQuery.refetch()
    : () => vetProfileQuery.refetch();

  if (isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading reviews…" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Couldn't load reviews" onRetry={handleRetry} />;
  }

  const emptyMessage =
    (reviews ?? []).length === 0
      ? "Reviews from adopters will show up here."
      : "No reviews match this filter — try a different one above.";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Reviews</h1>
      <p className="mt-2 max-w-xl text-slate-600">Read and reply to reviews from adopters.</p>

      <div className="mt-6">
        <ReviewsFilters value={filter} onChange={setFilter} />
      </div>

      <ReviewsSection
        reviews={filteredReviews}
        emptyMessage={emptyMessage}
        replyLabel={replyLabel}
        renderAction={(review) =>
          !review.reply && (
            <Button variant="secondary" size="sm" onClick={() => setReplyTarget(review)}>
              Reply
            </Button>
          )
        }
      />

      <ReplyToReviewDialog review={replyTarget} replyLabel={replyLabel} onClose={() => setReplyTarget(null)} />
    </motion.div>
  );
};

export default ReviewsPage;
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/dashboard/src/pages/reviews/components/ReviewsFilters.tsx frontend/apps/dashboard/src/pages/reviews/components/ReplyToReviewDialog.tsx frontend/apps/dashboard/src/pages/reviews/ReviewsPage.tsx
git commit -m "feat(dashboard): add the shared Reviews page for shelterEmployee and vet"
```

---

## Task 7: Wire routing and fix the `/reviews` role guard

**Files:**
- Modify: `frontend/apps/dashboard/src/App.tsx`

- [ ] **Step 1: Add the lazy import**

In `frontend/apps/dashboard/src/App.tsx`, add this line alongside the other `lazy(() =>
import(...))` declarations (after the `AppointmentsPage` lazy import line):
```tsx
const ReviewsPage = lazy(() => import("./pages/reviews/ReviewsPage"));
```

- [ ] **Step 2: Replace the `ComingSoonPage` route and fix its role guard**

Find:
```tsx
            <Route
              path="reviews"
              element={<ComingSoonPage title="Reviews" description="Read and reply to reviews from adopters." />}
            />
```
Replace it with:
```tsx
            <Route element={<RequireRole roles={["shelterEmployee", "vet"]} redirectTo={paths.home} />}>
              <Route path="reviews" element={<ReviewsPage />} />
            </Route>
```

This is the routing fix identified during discovery: today `/reviews` sits as a sibling to the
role-scoped blocks, guarded only by the outer `DASHBOARD_ROLES` check, so a `superadmin` can also
reach it. Wrapping it in its own `RequireRole` block — the same pattern already used for the
`shelterEmployee`-only and `vet`-only blocks — redirects a `superadmin` visiting `/reviews` to their
own Overview instead, exactly like visiting any other role's exclusive route today. Do not touch the
`notifications` or `account` `ComingSoonPage` routes, or anything under the `superadmin`-gated block —
both stay exactly as they are.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/dashboard/src/App.tsx
git commit -m "feat(dashboard): route Reviews to the new shared page and exclude superadmin"
```

---

## Task 8: Full workspace verification

**Files:** none (verification only)

- [ ] **Step 1: Full workspace typecheck**

Run: `cd frontend && npm run typecheck`
Expected: every workspace (`dashboard`, `public-web`, `api-client`, `auth`, `hooks`, `types`, `ui`,
`utilities`, `validation`) reports zero errors.

- [ ] **Step 2: Dashboard production build**

Run: `cd frontend && npm run build --workspace=@paw-match/dashboard`
Expected: build succeeds, no errors.

- [ ] **Step 3: Public Website production build (must remain unaffected)**

Run: `cd frontend && npm run build --workspace=@paw-match/public-web`
Expected: build succeeds, no errors — this is the most important build check this phase, since
`ReviewsSection` moved out of this app entirely; a failure here would mean the import-path repoint in
Task 5 missed something.

- [ ] **Step 4: Lint**

Run: `cd frontend && npm run lint`
Expected: no-op (no lint is configured anywhere in this repo, reconfirmed in every prior phase).

- [ ] **Step 5: Manual dev-server verification — Public Website regression check**

Run: `cd frontend/apps/public-web && npx vite --port <a free port>` (in the background), then, while
it's running:
- Visit a shelter detail page and a veterinarian detail page (any existing seeded, publicly-approved
  shelter/vet) and confirm the Reviews section at the bottom renders exactly as before — same layout,
  same average-rating display, same existing-reply display, no visual difference and no console
  errors, confirming the promotion didn't change public-web's behavior.
- Stop the dev server afterward.

- [ ] **Step 6: Manual dev-server verification — Dashboard**

Run: `cd frontend/apps/dashboard && npx vite --port <a free port>` (in the background), then, while
it's running, using existing seeded `shelterEmployee`/`vet` accounts if available (read-only — no new
accounts, no seeding, per the standing DB-read-only-during-testing policy):
- Confirm `/reviews` shows the filter (All/Needs reply/Replied), the review list (or the appropriate
  empty state per filter), and that "Reply" only appears on reviews without one yet.
- Confirm replying works end-to-end: the dialog opens with the review's own comment shown for
  context, submitting closes the dialog and the card immediately shows the new reply with the Reply
  action gone.
- Confirm attempting to reply to an already-replied review is impossible through the UI (no Reply
  button ever appears for it), and that if a 409 were ever hit (e.g. a race from a second tab), the
  backend's own message ("An official reply has already been added") would display via the existing
  generic error-surfacing pattern.
- Confirm signing in as `superadmin` and visiting `/reviews` now redirects to `/`, where it previously
  showed `ComingSoonPage`.
- Confirm `/notifications` and `/account` still show `ComingSoonPage` for every role — nothing
  belonging to a later phase was touched.
- Stop the dev server afterward.

- [ ] **Step 7: Responsive check**

With the Dashboard dev server running, check the Reviews page at 375px, 768px, 1024px, and 1440px:
confirm no horizontal page overflow and the filter/list layout (already a simple single-column card
list, unchanged from the promoted component) reads cleanly at every width.

- [ ] **Step 8: Verify query invalidation**

Confirm (via the React Query devtools or by observing the UI update without a manual refresh) that
replying to a review refreshes the reviews list immediately without a page reload, for both the
shelterEmployee path (`shelters, employee-detail` invalidated) and the vet path (`vetProfile, me`
invalidated).

- [ ] **Step 9: Report results**

Summarize: typecheck result, all three build results, lint result, and what was manually verified vs.
anything that couldn't be verified (e.g. no known shelterEmployee/vet test-account credentials with
existing reviews already seeded would limit how much of the live reply workflow could be exercised
without creating data, which the DB-read-only-during-testing policy prohibits).

---

## Self-review notes (completed during planning, not a task to execute)

- **Spec coverage:** Reused embedded reviews data (no new listing endpoint) → Task 1 (type fix) +
  Task 6 (page reuses existing hooks). Reply mutation → Tasks 2-4. `ReviewsSection` promotion →
  Task 5. Client-side All/Needs-reply/Replied filter → Task 6. `/reviews` routing fix → Task 7. All
  four confirmed backend facts (no listing endpoint needed, reply is permanent, moderation statuses
  are dead code, the 500-vs-1000 length mismatch) are reflected directly in the code, not just
  documented.
- **No placeholders:** every step shows complete file content or an exact diff; no "add error
  handling"/"TBD" phrasing appears.
- **Type consistency:** `Review`/`ReviewReplyInfo`/`ReviewAuthor` (unchanged, pre-existing) are the
  only types this phase's reply flow needs — no new type was invented for the reply payload beyond
  the plain `{id, text}` mutation-variable shape, which matches exactly between the hook (Task 4) and
  its one call site (Task 6's `ReplyToReviewDialog`). `ShelterEmployeeShelterDetail.reviews` (Task 1)
  is read by exactly one place (`ReviewsPage`, Task 6) via the exact same
  `shelterEmployeeShelterHooks.useMyShelterDetail` call `MyShelterPage` already makes — no new query
  key, no duplicate fetch.
- **No class-cascade or component-API risk this phase** — the one shared-component change
  (`ReviewsSection`'s new `renderAction` prop) is purely additive and optional, verified against both
  existing call sites passing no such prop, so their rendered output is provably unchanged.
- **Backward compatibility of the two hook signature changes (Task 4) double-checked**: grepped for
  every existing call site of `useMyShelterEmployeeProfile()` and `useMyVetProfile()` across
  `apps/dashboard/src` — all call with zero arguments, so adding an optional parameter with a
  default (`{}`) and a default-true `enabled` changes nothing about their existing behavior.
