# Shelter Employee Assignment (Super Admin Dashboard) Implementation Plan

**Goal:** Let the superadmin link/unlink `shelterEmployee` users to shelters from the Dashboard, closing the Phase 2 gap that currently requires Postman.

**Architecture:** A "Manage employees" modal on the existing Super Admin Shelters page, built entirely on three already-existing backend endpoints. No backend changes.

**Tech Stack:** React 19, TanStack Query, react-hook-form not needed (no form, just list actions), existing `@paw-match/ui` primitives.

---

## Backend endpoints used (all pre-existing, verified against source and live data)

| Purpose | Endpoint | Notes |
|---|---|---|
| List every `ShelterEmployeeProfile`, with populated `userId` and `shelterId` | `GET /shelter-employee-profile` | superadmin only. `shelterEmployeeProfileController.getAll` — no query params, returns everything unfiltered. |
| Assign | `PATCH /shelters/:id/employees` body `{ employeeId }` | superadmin bypasses the Manager-permission check entirely (`checkShelterEmployeePermission` returns `true` immediately for `role === "superadmin"`). Rejects if shelter isn't approved+verified+active, if the user is inactive, or if already assigned elsewhere. |
| Unassign | `DELETE /shelters/:id/employees/:employeeId` | Same permission bypass. Rejects if the employee isn't currently in `shelter.employees`. |

## Answering the "Important" instruction

`GET /user` (superadmin) excludes all profile data — `userController.getAll` explicitly `.select()`s only User fields (`-password -passwordResetToken ...`) and never touches `ShelterEmployeeProfile`. **On its own it cannot determine assignment status.**

However, `GET /shelter-employee-profile` (`shelterEmployeeProfileController.getAll`, already implemented, superadmin-gated) already does the full join: it returns every profile with `userId` populated (name/email/phone/profileImage/role/isActive) **and** `shelterId` populated (name/address/city). This single, existing, no-new-code endpoint fully answers "who is unassigned" (`shelterId === null`) and "who is assigned to shelter X" (`shelterId._id === X`) in one request. **No backend limitation exists — the smallest frontend-safe approach is to consume this endpoint instead of `GET /user`.**

## A real data-shape wrinkle found during inspection

Live data (read via the superadmin session, read-only) shows:
- 7 of 10 `ShelterEmployeeProfile` documents have `userId: null` — the referenced `User` account was deleted, leaving an orphaned profile (same dangling-populate-ref class found in every prior phase).
- Some of those orphaned profiles still have a `shelterId` set (e.g. seeded "manager"/"employee" position placeholders for Baghdad Happy Paws / Diyala Animal Rescue) — **but those user IDs are absent from the shelter's actual `employees` array.**
- `Shelter.employees` (the array `addEmployee`/`removeEmployee` actually read and mutate) is the only field that determines whether "Remove" will succeed — `removeEmployee` 404s with "Employee not found in this shelter" for anything not in that array.

**Design decision:** "Currently assigned" is derived from `shelter.employees` (the authoritative, mutable relationship), cross-referenced against the profile list purely for display data. A `shelter.employees` entry with no matching `ShelterEmployeeProfile` (e.g. a vet, who also lives in `shelter.employees` but has no `ShelterEmployeeProfile`) is not shown here — correct, since this feature is scoped to shelter-employee assignment only, and vets are managed by their own model/screens. "Available" is `ShelterEmployeeProfile` where `shelterId === null && userId !== null` — orphaned no-user profiles are excluded since there's nothing to display or assign.

This also means `AdminShelter` needs one additive field: `employees: MongoId[]` (the raw, unpopulated ObjectId array — confirmed present in the real `GET /shelters/admin/all` response, just never modeled in the TS type before now, since nothing previously needed it).

## Files

### 1. Types

**Modify `packages/types/src/shelter.ts`:**
```ts
export interface AdminShelter extends PublicShelter {
  verificationStatus: "pending" | "approved" | "rejected";
  isVerified: boolean;
  isActive: boolean;
  rejectionReason: string | null;
  verifiedAt: string | null;
  updatedAt: string;
  createdBy: AdminShelterRef | null;
  verifiedBy: AdminShelterRef | null;
  /** Raw, unpopulated User ObjectIds — GET /shelters/admin/all never populates this field. Mixed shelterEmployee + vet IDs. */
  employees: MongoId[];
}
```

**Modify `packages/types/src/shelterEmployeeProfile.ts`** — add a new type distinct from the existing `ShelterEmployeeProfile` (which stays exactly as-is; it's used by 6 files consuming `GET /shelter-employee-profile/me`, where `userId` is always the caller's own — real — account, so it should stay non-nullable there):
```ts
/**
 * Shape returned by GET /shelter-employee-profile (Super Admin, lists every
 * profile across every shelter). Unlike the `/me` response above, `userId`
 * can be null here: the referenced User account may have been deleted while
 * the orphaned profile document remains (confirmed against real data — 7 of
 * 10 profiles currently have userId: null).
 */
export interface ShelterEmployeeProfileAdminEntry {
  _id: MongoId;
  userId: ShelterEmployeeProfileUserRef | null;
  shelterId: ShelterEmployeeProfileShelterRef | null;
  position: ShelterEmployeePosition;
  employeeNumber: string | null;
  hireDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 2. API client

**New `packages/api-client/src/shelterEmployeeAdmin.ts`:**
```ts
/**
 * Super-Admin-only listing of every ShelterEmployeeProfile document, used to
 * determine assignment status. Distinct from ./shelterEmployeeProfile.ts,
 * which is the self-service `/me` endpoint for the logged-in employee.
 */
import type { AxiosInstance } from "axios";
import type { ShelterEmployeeProfileAdminEntry } from "@paw-match/types";

export const getAllShelterEmployeeProfilesAdmin = async (
  client: AxiosInstance,
): Promise<ShelterEmployeeProfileAdminEntry[]> => {
  const { data } = await client.get<{ success: true; message: string; data: ShelterEmployeeProfileAdminEntry[] }>(
    "/shelter-employee-profile",
  );
  return data.data;
};
```

**Modify `packages/api-client/src/shelterAdmin.ts`** — add two functions, same file as the other superadmin shelter mutations:
```ts
/** PATCH /shelters/:id/employees — assigns a shelterEmployee or vet user; rejects (409/403/404) if inactive, already assigned elsewhere, or the shelter isn't approved+verified+active. Response body unused — callers rely on query invalidation. */
export const assignShelterEmployee = async (
  client: AxiosInstance,
  shelterId: string,
  employeeId: string,
): Promise<void> => {
  await client.patch(`/shelters/${shelterId}/employees`, { employeeId });
};

/** DELETE /shelters/:id/employees/:employeeId — 404s if the employee isn't currently in this shelter's employees array. */
export const unassignShelterEmployee = async (
  client: AxiosInstance,
  shelterId: string,
  employeeId: string,
): Promise<void> => {
  await client.delete(`/shelters/${shelterId}/employees/${employeeId}`);
};
```

### 3. Hooks

**New `packages/hooks/src/shelterEmployeeAdmin.ts`:**
```ts
import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getAllShelterEmployeeProfilesAdmin } from "@paw-match/api-client";

export const createShelterEmployeeAdminHooks = (client: AxiosInstance) => {
  const useAllShelterEmployeeProfilesAdmin = () =>
    useQuery({
      queryKey: ["shelterEmployeeProfiles", "admin"],
      queryFn: () => getAllShelterEmployeeProfilesAdmin(client),
    });

  return { useAllShelterEmployeeProfilesAdmin };
};
```

**Modify `packages/hooks/src/shelterAdmin.ts`** — add two mutations that invalidate both affected queries (shelter's `employees` array changed, and the profile's `shelterId` changed):
```ts
const invalidateShelterEmployeeProfiles = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: ["shelterEmployeeProfiles", "admin"] });

const useAssignShelterEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shelterId, employeeId }: { shelterId: string; employeeId: string }) =>
      assignShelterEmployee(client, shelterId, employeeId),
    onSuccess: () => {
      invalidateAdminShelters(queryClient);
      invalidateShelterEmployeeProfiles(queryClient);
    },
  });
};

const useUnassignShelterEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shelterId, employeeId }: { shelterId: string; employeeId: string }) =>
      unassignShelterEmployee(client, shelterId, employeeId),
    onSuccess: () => {
      invalidateAdminShelters(queryClient);
      invalidateShelterEmployeeProfiles(queryClient);
    },
  });
};
```
(added to the returned object alongside the existing four hooks)

### 4. Dashboard wiring

**New `apps/dashboard/src/lib/shelterEmployeeAdminHooks.ts`:**
```ts
import { createShelterEmployeeAdminHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";
export const shelterEmployeeAdminHooks = createShelterEmployeeAdminHooks(apiClient);
```

### 5. UI

**Modify `apps/dashboard/src/pages/superadmin/components/SheltersTable.tsx`:**
- Add `Users` icon button (same visual treatment as the existing `Eye`/"View" button) opening a new `manageEmployeesTarget` state, right next to the View button.
- Render `<ManageShelterEmployeesModal shelter={manageEmployeesTarget} onClose={() => setManageEmployeesTarget(null)} />`.

**New `apps/dashboard/src/pages/superadmin/components/ManageShelterEmployeesModal.tsx`:**
- `Modal size="lg"`, title = shelter name.
- `shelterEmployeeAdminHooks.useAllShelterEmployeeProfilesAdmin()` — loading → `Spinner`; error → `ErrorState` with retry.
- Derive:
  - `assignedIds = new Set(shelter.employees)`
  - `assignedProfiles = profiles.filter(p => p.userId && assignedIds.has(p.userId._id))`
  - `availableProfiles = profiles.filter(p => p.userId && p.shelterId === null)`
- Local state: `search` (string), `actionError: { employeeId: string; message: string } | null`.
- **Currently assigned** section: `Table` (UserAvatar + name, email, phone or "—", `Badge` active/inactive, Remove button) or `EmptyState` ("No employees assigned yet").
- **Available employees** section: `Input` search (filters client-side by name/email, same pattern as `UsersFilters`) + `Table` (same columns + Assign button) or `EmptyState` ("No shelterEmployee accounts are available to assign" / "No results match your search").
- Assign button: disabled while `useAssignShelterEmployee().isPending` for that row's id, **and** disabled with a tooltip when `userId.isActive === false` (mirrors the backend's own "Inactive user cannot be added to a shelter" rejection — a proactive UI guard, not a replacement for the backend check).
- Remove button: disabled while `useUnassignShelterEmployee().isPending` for that row's id.
- Both buttons for a given row disabled while **either** mutation is pending for that id (prevents duplicate-click double-submits).
- On mutation error: set `actionError`, shown as an inline `role="alert"` message under the acted-on row via `getApiErrorMessage`; cleared on next action attempt or modal close.
- On success: no local state mutation needed — invalidated queries refetch and the row moves from one section to the other automatically.

No new route or role-guard needed: this modal lives entirely inside the Shelters page, which is already wrapped in `<RequireRole roles={["superadmin"]} redirectTo={paths.home} />` in `App.tsx`. `shelterEmployee` users cannot reach it.

Position/employee-number/hire-date editing is explicitly **not** built — `addEmployee`/`removeEmployee` don't accept those fields (`removeEmployee` actively resets them on unassign), and the only endpoint that touches them (`PUT /shelter-employee-profile/:userId/work-data`) isn't part of this task.

## Verification

- Full workspace `tsc` typecheck.
- Dashboard production build.
- Public Website production build (sanity — untouched by this work, should be a no-op check).
- Lint (expected no-op, as in every prior phase).
- Read-only re-check of `GET /shelter-employee-profile` and `GET /shelters/admin/all` shapes against the new types (already spot-checked above; will re-verify against the final TS types).
- **This phase's mutations are real writes** (assign/unassign), unlike prior phases' read-only verification. I'll only exercise them against the disposable test account created earlier this session (`shelteremployee.test@pawmatch.com`, currently linked to Diyala Animal Rescue Center) — e.g. unassign it, then reassign it — never against the pre-existing seeded manager/employee positions. I'll ask for explicit confirmation before running that part of verification.

---

Please review and let me know if you'd like changes — in particular:
1. The "Manage employees" trigger as an icon button next to "View", vs. tucking it into the overflow (`RowActionsMenu`) instead.
2. The "assigned = in `shelter.employees`" vs "assigned = has this `shelterId`" design decision above (I recommend the former, since it's the only definition consistent with what "Remove" can actually undo).
