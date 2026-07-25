# Super Admin Dashboard Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Super Admin's Dashboard Overview, Shelters Management, and Users Management pages on top of the approved design (`docs/superpowers/specs/2026-07-24-superadmin-dashboard-foundation-design.md`), using only existing backend endpoints, reusing Phase 1's shared components, and adding only the new shared primitives (Modal, Table, TableSkeleton, RowActionsMenu) the spec identified as missing.

**Architecture:** A new admin-only data layer (types → api-client → hooks, mirroring the existing `shelters.ts`/`user.ts` factory-hook pattern but kept in separate files per the codebase's own documented public/self-service vs. admin boundary) feeds three new page trees under `apps/dashboard/src/pages/superadmin/`. All list/search/filter/sort/pagination logic is client-side against a single unfiltered fetch per resource, per the approved decisions. Four new primitives land in `packages/ui` because both new pages need them and no equivalent exists yet.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Framer Motion, TanStack Query v5, React Hook Form + Zod, React Router v7 — all already in place; no new dependencies required anywhere in this plan.

**Verification approach:** This codebase has no test framework configured anywhere (checked: no `vitest`/`jest`/`@testing-library` dependency in any workspace, no `*.test.ts*`/`*.spec.ts*` file exists). Phase 1 was verified via `tsc` typecheck, production builds, and a manual dev-server route/behavior check — not unit tests. This plan follows that same established convention rather than introducing a new test framework, which would be an unrelated architectural change outside the approved scope. Each task ends with a typecheck checkpoint instead of a test run; a full manual verification pass closes the plan.

---

## Backend endpoints used (all pre-existing, none modified)

| Endpoint | Method | Used for |
|---|---|---|
| `/shelters/admin/all` | GET | Shelters table + Overview stats/activity (`verificationStatus`/`isActive`/`city` filters exist but are **not** sent — everything is fetched once and filtered client-side per the approved decision) |
| `/shelters/:id/approve` | PATCH | Approve action |
| `/shelters/:id/reject` | PATCH | Reject action (body: `{ reason }`) |
| `/shelters/:id/status` | PATCH | Activate/Deactivate action |
| `/shelters/:id/permanent` | DELETE | Delete permanently action |
| `/user` | GET | Users table + Overview stats/activity (no query params exist on this endpoint at all) |
| `/user/:id/role` | PUT | Change role action (body: `{ role }`) |
| `/user/:id/status` | PUT | Activate/Deactivate action (body: `{ isActive }`) |

No endpoint is invented. No backend file is modified.

---

## File inventory

**New — data layer:**
- `frontend/packages/types/src/shelter.ts` (modified — add types)
- `frontend/packages/types/src/user.ts` (modified — add types)
- `frontend/packages/validation/src/shelterAdmin.ts` (new)
- `frontend/packages/validation/src/index.ts` (modified — add export)
- `frontend/packages/api-client/src/shelterAdmin.ts` (new)
- `frontend/packages/api-client/src/userManagement.ts` (new)
- `frontend/packages/api-client/src/index.ts` (modified — add exports)
- `frontend/packages/hooks/src/shelterAdmin.ts` (new)
- `frontend/packages/hooks/src/userManagement.ts` (new)
- `frontend/packages/hooks/src/index.ts` (modified — add exports)
- `frontend/apps/dashboard/src/lib/shelterAdminHooks.ts` (new)
- `frontend/apps/dashboard/src/lib/userManagementHooks.ts` (new)

**New — shared UI (`packages/ui`):**
- `frontend/packages/ui/src/Modal.tsx` (new)
- `frontend/packages/ui/src/Table.tsx` (new)
- `frontend/packages/ui/src/TableSkeleton.tsx` (new)
- `frontend/packages/ui/src/RowActionsMenu.tsx` (new)
- `frontend/packages/ui/src/index.ts` (modified — add exports)

**New — Dashboard-wide component:**
- `frontend/apps/dashboard/src/components/dashboard/StatCard.tsx` (new)

**New — Overview (superadmin variant):**
- `frontend/apps/dashboard/src/pages/superadmin/SuperAdminOverview.tsx` (new)
- `frontend/apps/dashboard/src/pages/superadmin/components/RecentActivityFeed.tsx` (new)
- `frontend/apps/dashboard/src/pages/OverviewPage.tsx` (modified — role branch)

**New — Shelters Management:**
- `frontend/apps/dashboard/src/pages/superadmin/components/SheltersFilters.tsx` (new)
- `frontend/apps/dashboard/src/pages/superadmin/components/SheltersTable.tsx` (new)
- `frontend/apps/dashboard/src/pages/superadmin/components/RejectShelterDialog.tsx` (new)
- `frontend/apps/dashboard/src/pages/superadmin/components/DeleteShelterDialog.tsx` (new)
- `frontend/apps/dashboard/src/pages/superadmin/components/ShelterQuickViewModal.tsx` (new)
- `frontend/apps/dashboard/src/pages/superadmin/SheltersPage.tsx` (new)

**New — Users Management:**
- `frontend/apps/dashboard/src/pages/superadmin/components/UsersFilters.tsx` (new)
- `frontend/apps/dashboard/src/pages/superadmin/components/UsersTable.tsx` (new)
- `frontend/apps/dashboard/src/pages/superadmin/components/ChangeRoleDialog.tsx` (new)
- `frontend/apps/dashboard/src/pages/superadmin/components/UserQuickViewModal.tsx` (new)
- `frontend/apps/dashboard/src/pages/superadmin/UsersPage.tsx` (new)

**Modified — routing:**
- `frontend/apps/dashboard/src/App.tsx` (modified — swap `ComingSoonPage` for the two real pages on `shelters`/`users` routes)

No file outside `frontend/` is touched. No backend file is touched.

---

## Task 1: Admin types

**Files:**
- Modify: `frontend/packages/types/src/shelter.ts`
- Modify: `frontend/packages/types/src/user.ts`

- [ ] **Step 1: Add `AdminShelterRef`/`AdminShelter` to `shelter.ts`**

Change the top import line from:
```ts
import type { MongoId } from "./common";
```
to:
```ts
import type { MongoId, UserRole } from "./common";
```

Then append to the end of the file:
```ts

/**
 * `createdBy`/`verifiedBy` as populated by `GET /shelters/admin/all` (see
 * shelter.controller.js `getAllShelters` — `.populate("createdBy", "firstName lastName email role")`
 * and `.populate("verifiedBy", "firstName lastName email")`). `role` is only
 * ever present on `createdBy`; `verifiedBy` never includes it.
 */
export interface AdminShelterRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  role?: UserRole;
}

/**
 * Shape returned by `GET /shelters/admin/all` (Super Admin only) — every
 * shelter regardless of verification/active status. Mirrors
 * shelter.controller.js `getAllShelters`; the approve/reject/status/delete
 * endpoints mutate and return this same shape (delete returns a summary
 * instead — see @paw-match/api-client's DeleteShelterResult).
 */
export interface AdminShelter extends PublicShelter {
  verificationStatus: "pending" | "approved" | "rejected";
  isVerified: boolean;
  isActive: boolean;
  rejectionReason: string | null;
  verifiedAt: string | null;
  updatedAt: string;
  createdBy: AdminShelterRef;
  verifiedBy: AdminShelterRef | null;
}
```

- [ ] **Step 2: Add `AdminUser`/`UpdateUserRoleResult`/`UpdateUserStatusResult` to `user.ts`**

Append to the end of `frontend/packages/types/src/user.ts` (its existing imports already include `MongoId, UserRole` from `./common`, so no import line changes needed here):
```ts

/**
 * Shape returned by `GET /user` and `GET /user/:id` (Super Admin only) —
 * every registered user with the same sensitive-field exclusions as
 * `GET /user/profile` (password, reset token, verification code, refresh
 * token), plus `createdAt`, which the self-service AuthUser shape omits.
 */
export interface AdminUser extends AuthUser {
  createdAt: string;
}

/** `data` shape returned by `PUT /user/:id/role` — deliberately partial, see user.controller.js's updateRole. */
export interface UpdateUserRoleResult {
  _id: MongoId;
  role: UserRole;
}

/** `data` shape returned by `PUT /user/:id/status` — deliberately partial, see user.controller.js's updateStatus. */
export interface UpdateUserStatusResult {
  _id: MongoId;
  role: UserRole;
  isActive: boolean;
}
```

- [ ] **Step 3: Typecheck the types package**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/types`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/packages/types/src/shelter.ts frontend/packages/types/src/user.ts
git commit -m "feat(types): add admin shelter/user types for Super Admin Dashboard"
```

---

## Task 2: Reject-reason validation schema

**Files:**
- Create: `frontend/packages/validation/src/shelterAdmin.ts`
- Modify: `frontend/packages/validation/src/index.ts`

- [ ] **Step 1: Create the schema**

```ts
/** Zod schema mirroring src/validation/shelter.validate.js's rejectShelterValidation. */
import { z } from "zod";

export const rejectShelterSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Rejection reason must be between 3 and 1000 characters")
    .max(1000, "Rejection reason must be between 3 and 1000 characters"),
});

export type RejectShelterFormValues = z.infer<typeof rejectShelterSchema>;
```

- [ ] **Step 2: Export it**

Add this line to `frontend/packages/validation/src/index.ts` (after the existing `export * from "./user";` line):
```ts
export * from "./shelterAdmin";
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/validation`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/packages/validation/src/shelterAdmin.ts frontend/packages/validation/src/index.ts
git commit -m "feat(validation): add reject-shelter reason schema"
```

---

## Task 3: Admin API client functions

**Files:**
- Create: `frontend/packages/api-client/src/shelterAdmin.ts`
- Create: `frontend/packages/api-client/src/userManagement.ts`
- Modify: `frontend/packages/api-client/src/index.ts`

- [ ] **Step 1: Create `shelterAdmin.ts`**

```ts
/**
 * Super-Admin-only endpoint functions for src/routes/shelter.route.js +
 * src/controllers/shelter.controller.js's admin actions. Kept separate from
 * ./shelters.ts, which is documented there as the public/adopter-facing
 * subset only.
 */
import type { AxiosInstance } from "axios";
import type { AdminShelter } from "@paw-match/types";

export interface AdminSheltersFilters {
  verificationStatus?: "pending" | "approved" | "rejected";
  isActive?: boolean;
  city?: string;
}

/** GET /shelters/admin/all — no server-side search or pagination; every filter here maps to a real backend query param, but the Dashboard calls this with no filters and does everything client-side (see @paw-match/hooks's createShelterAdminHooks). */
export const getAllSheltersAdmin = async (
  client: AxiosInstance,
  filters: AdminSheltersFilters = {},
): Promise<AdminShelter[]> => {
  const { data } = await client.get<{ success: true; message: string; data: AdminShelter[] }>(
    "/shelters/admin/all",
    { params: filters },
  );
  return data.data;
};

/** PATCH /shelters/:id/approve — 400 if the shelter is already approved. */
export const approveShelter = async (client: AxiosInstance, id: string): Promise<AdminShelter> => {
  const { data } = await client.patch<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/approve`,
  );
  return data.data;
};

/** PATCH /shelters/:id/reject — reason must be 3-1000 characters (see @paw-match/validation's rejectShelterSchema). */
export const rejectShelter = async (
  client: AxiosInstance,
  id: string,
  reason: string,
): Promise<AdminShelter> => {
  const { data } = await client.patch<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/reject`,
    { reason },
  );
  return data.data;
};

/** PATCH /shelters/:id/status — toggles isActive; 400 if activating a shelter that isn't approved+verified. */
export const toggleShelterStatus = async (client: AxiosInstance, id: string): Promise<AdminShelter> => {
  const { data } = await client.patch<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/status`,
  );
  return data.data;
};

export interface DeleteShelterResult {
  animals: number;
  adoptionRequests: number;
  cloudinaryFilesRequested: number;
}

/**
 * DELETE /shelters/:id/permanent — irreversible. Backend rejects with 400 if
 * the shelter is still active, or 409 if active (non-terminal) adoption
 * requests still reference it; both are surfaced to the user as returned,
 * never re-validated client-side.
 */
export const permanentlyDeleteShelter = async (
  client: AxiosInstance,
  id: string,
): Promise<DeleteShelterResult> => {
  const { data } = await client.delete<{
    success: true;
    message: string;
    deletedData: DeleteShelterResult;
  }>(`/shelters/${id}/permanent`);
  return data.deletedData;
};
```

- [ ] **Step 2: Create `userManagement.ts`**

```ts
/**
 * Super-Admin-only endpoint functions for the admin subset of
 * src/routes/user.route.js. Kept separate from ./user.ts, which is
 * documented there as the self-service subset only.
 */
import type { AxiosInstance } from "axios";
import type {
  AdminUser,
  UpdateUserRoleResult,
  UpdateUserStatusResult,
  UserRole,
} from "@paw-match/types";

/** GET /user — no query params supported by the backend; every user is returned in one response. */
export const getAllUsers = async (client: AxiosInstance): Promise<AdminUser[]> => {
  const { data } = await client.get<{ success: true; count: number; data: AdminUser[] }>("/user");
  return data.data;
};

export const getUserById = async (client: AxiosInstance, id: string): Promise<AdminUser> => {
  const { data } = await client.get<{ success: true; data: AdminUser }>(`/user/${id}`);
  return data.data;
};

/** PUT /user/:id/role — 403 if the target is superadmin, 400 if the role is unchanged. Response is deliberately partial (see @paw-match/types's UpdateUserRoleResult). */
export const updateUserRole = async (
  client: AxiosInstance,
  id: string,
  role: Exclude<UserRole, "superadmin">,
): Promise<UpdateUserRoleResult> => {
  const { data } = await client.put<{ success: true; message: string; data: UpdateUserRoleResult }>(
    `/user/${id}/role`,
    { role },
  );
  return data.data;
};

/** PUT /user/:id/status — 400 if changing your own account, 403 if deactivating another superadmin, 400 if the status is unchanged. */
export const updateUserStatus = async (
  client: AxiosInstance,
  id: string,
  isActive: boolean,
): Promise<UpdateUserStatusResult> => {
  const { data } = await client.put<{ success: true; message: string; data: UpdateUserStatusResult }>(
    `/user/${id}/status`,
    { isActive },
  );
  return data.data;
};
```

- [ ] **Step 3: Export both**

Add these two lines to `frontend/packages/api-client/src/index.ts` (after the existing `export * from "./user";` line):
```ts
export * from "./shelterAdmin";
export * from "./userManagement";
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/api-client`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/packages/api-client/src/shelterAdmin.ts frontend/packages/api-client/src/userManagement.ts frontend/packages/api-client/src/index.ts
git commit -m "feat(api-client): add Super Admin shelter and user management endpoints"
```

---

## Task 4: Admin query/mutation hooks

**Files:**
- Create: `frontend/packages/hooks/src/shelterAdmin.ts`
- Create: `frontend/packages/hooks/src/userManagement.ts`
- Modify: `frontend/packages/hooks/src/index.ts`
- Create: `frontend/apps/dashboard/src/lib/shelterAdminHooks.ts`
- Create: `frontend/apps/dashboard/src/lib/userManagementHooks.ts`

- [ ] **Step 1: Create `packages/hooks/src/shelterAdmin.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  approveShelter,
  getAllSheltersAdmin,
  permanentlyDeleteShelter,
  rejectShelter,
  toggleShelterStatus,
  type AdminSheltersFilters,
} from "@paw-match/api-client";

/**
 * Query hook factory for Super-Admin shelter management. Only
 * verificationStatus/isActive/city are ever sendable to the backend —
 * search/sort/pagination happen client-side against this cached list (see
 * apps/dashboard/src/pages/superadmin/SheltersPage.tsx).
 */
export const createShelterAdminHooks = (client: AxiosInstance) => {
  const adminSheltersKey = (filters: AdminSheltersFilters) => ["shelters", "admin", filters] as const;

  const useAdminShelters = (filters: AdminSheltersFilters = {}) =>
    useQuery({
      queryKey: adminSheltersKey(filters),
      queryFn: () => getAllSheltersAdmin(client, filters),
    });

  const invalidateAdminShelters = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["shelters", "admin"] });

  const useApproveShelter = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => approveShelter(client, id),
      onSuccess: () => invalidateAdminShelters(queryClient),
    });
  };

  const useRejectShelter = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectShelter(client, id, reason),
      onSuccess: () => invalidateAdminShelters(queryClient),
    });
  };

  const useToggleShelterStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => toggleShelterStatus(client, id),
      onSuccess: () => invalidateAdminShelters(queryClient),
    });
  };

  const useDeleteShelterPermanently = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => permanentlyDeleteShelter(client, id),
      onSuccess: () => invalidateAdminShelters(queryClient),
    });
  };

  return {
    useAdminShelters,
    useApproveShelter,
    useRejectShelter,
    useToggleShelterStatus,
    useDeleteShelterPermanently,
  };
};
```

- [ ] **Step 2: Create `packages/hooks/src/userManagement.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getAllUsers, updateUserRole, updateUserStatus } from "@paw-match/api-client";
import type { UserRole } from "@paw-match/types";

/**
 * Query hook factory for Super-Admin user management. GET /user has no
 * query params at all, so search/filter/sort/pagination all happen
 * client-side against this cached list (see
 * apps/dashboard/src/pages/superadmin/UsersPage.tsx).
 */
export const createUserManagementHooks = (client: AxiosInstance) => {
  const adminUsersKey = ["users", "admin"] as const;

  const useAdminUsers = () =>
    useQuery({
      queryKey: adminUsersKey,
      queryFn: () => getAllUsers(client),
    });

  const invalidateAdminUsers = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: adminUsersKey });

  const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, role }: { id: string; role: Exclude<UserRole, "superadmin"> }) =>
        updateUserRole(client, id, role),
      onSuccess: () => invalidateAdminUsers(queryClient),
    });
  };

  const useUpdateUserStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
        updateUserStatus(client, id, isActive),
      onSuccess: () => invalidateAdminUsers(queryClient),
    });
  };

  return {
    useAdminUsers,
    useUpdateUserRole,
    useUpdateUserStatus,
  };
};
```

- [ ] **Step 3: Export both**

Add these two lines to `frontend/packages/hooks/src/index.ts` (after the existing `export * from "./user";` line):
```ts
export * from "./shelterAdmin";
export * from "./userManagement";
```

- [ ] **Step 4: Wire both into the Dashboard app**

Create `frontend/apps/dashboard/src/lib/shelterAdminHooks.ts`:
```ts
import { createShelterAdminHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const shelterAdminHooks = createShelterAdminHooks(apiClient);
```

Create `frontend/apps/dashboard/src/lib/userManagementHooks.ts`:
```ts
import { createUserManagementHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const userManagementHooks = createUserManagementHooks(apiClient);
```

- [ ] **Step 5: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/hooks && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/packages/hooks/src/shelterAdmin.ts frontend/packages/hooks/src/userManagement.ts frontend/packages/hooks/src/index.ts frontend/apps/dashboard/src/lib/shelterAdminHooks.ts frontend/apps/dashboard/src/lib/userManagementHooks.ts
git commit -m "feat(hooks): add Super Admin shelter and user management hooks"
```

---

## Task 5: Shared `Modal` component

**Files:**
- Create: `frontend/packages/ui/src/Modal.tsx`
- Modify: `frontend/packages/ui/src/index.ts`

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@paw-match/utilities";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Generic dialog shell — same backdrop-blur + scale/opacity/y motion
 * language as the Public Website's QuickViewModal, generalized so every
 * Dashboard confirm/edit/quick-view dialog can build on one component
 * instead of duplicating the shell.
 */
export const Modal = ({ isOpen, onClose, title, children, footer, className }: ModalProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl",
              className,
            )}
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer && (
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

- [ ] **Step 2: Export it**

Add to `frontend/packages/ui/src/index.ts` (after the existing `export * from "./AppLoader";` line):
```ts
export * from "./Modal";
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/ui`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/packages/ui/src/Modal.tsx frontend/packages/ui/src/index.ts
git commit -m "feat(ui): add shared Modal component"
```

---

## Task 6: Shared `Table` primitives + `TableSkeleton`

**Files:**
- Create: `frontend/packages/ui/src/Table.tsx`
- Create: `frontend/packages/ui/src/TableSkeleton.tsx`
- Modify: `frontend/packages/ui/src/index.ts`

- [ ] **Step 1: Create `Table.tsx`**

```tsx
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@paw-match/utilities";

/** Scrollable card chrome around a semantic <table> — column definitions stay page-specific. */
export const Table = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm", className)}
    {...props}
  >
    <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
  </div>
);

/** Renders its children (TableHeaderCells) inside the single header row this table ever needs. */
export const TableHead = ({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("border-b border-slate-200 bg-slate-50", className)} {...props}>
    <tr>{children}</tr>
  </thead>
);

export const TableHeaderCell = ({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    scope="col"
    className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500", className)}
    {...props}
  >
    {children}
  </th>
);

export const TableBody = ({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("divide-y divide-slate-100", className)} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("transition-colors hover:bg-slate-50", className)} {...props}>
    {children}
  </tr>
);

export const TableCell = ({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-4 py-3 align-middle text-slate-700", className)} {...props}>
    {children}
  </td>
);
```

- [ ] **Step 2: Create `TableSkeleton.tsx`**

```tsx
import { Skeleton } from "./Skeleton";
import { VisuallyHidden } from "./VisuallyHidden";
import { Table, TableBody, TableCell, TableRow } from "./Table";
import { cn } from "@paw-match/utilities";

export interface TableSkeletonProps {
  /** Number of placeholder rows. */
  rows?: number;
  /** Number of placeholder columns — should match the real table's column count. */
  columns: number;
  label?: string;
  className?: string;
}

/** Loading placeholder shaped like the real table it stands in for, built from the shared Skeleton atom (same spirit as ListSkeleton, tabular shape). */
export const TableSkeleton = ({ rows = 5, columns, label = "Loading", className }: TableSkeletonProps) => (
  <div role="status" aria-live="polite" className={className}>
    <VisuallyHidden>{label}</VisuallyHidden>
    <Table aria-hidden>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className={cn("hover:bg-transparent")}>
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <TableCell key={columnIndex}>
                <Skeleton className="h-4 w-full max-w-[10rem]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
```

- [ ] **Step 3: Export both**

Add to `frontend/packages/ui/src/index.ts` (after the `export * from "./Modal";` line just added):
```ts
export * from "./Table";
export * from "./TableSkeleton";
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/ui`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/packages/ui/src/Table.tsx frontend/packages/ui/src/TableSkeleton.tsx frontend/packages/ui/src/index.ts
git commit -m "feat(ui): add shared Table primitives and TableSkeleton"
```

---

## Task 7: Shared `RowActionsMenu` component

**Files:**
- Create: `frontend/packages/ui/src/RowActionsMenu.tsx`
- Modify: `frontend/packages/ui/src/index.ts`

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, useRef, useState, type ComponentType } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@paw-match/utilities";
import { VisuallyHidden } from "./VisuallyHidden";

export interface RowAction {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Shown as a native title/tooltip on the disabled item, explaining why it's unavailable. */
  disabledReason?: string;
}

export interface RowActionsMenuProps {
  actions: RowAction[];
  label?: string;
}

/**
 * Overflow (⋮) menu for secondary row actions — same open/outside-click/
 * Escape-key interaction already hand-rolled in NotificationBell,
 * generalized for any list of actions. This is where destructive,
 * de-emphasized actions (e.g. permanently deleting a shelter) live, rather
 * than as a primary button.
 */
export const RowActionsMenu = ({ actions, label = "Row actions" }: RowActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (actions.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
        <VisuallyHidden>{label}</VisuallyHidden>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              title={action.disabled ? action.disabledReason : undefined}
              onClick={() => {
                setIsOpen(false);
                action.onClick();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                action.tone === "danger" ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              {action.icon && <action.icon className="h-4 w-4 shrink-0" aria-hidden />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Export it**

Add to `frontend/packages/ui/src/index.ts` (after `export * from "./TableSkeleton";`):
```ts
export * from "./RowActionsMenu";
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/ui`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/packages/ui/src/RowActionsMenu.tsx frontend/packages/ui/src/index.ts
git commit -m "feat(ui): add shared RowActionsMenu component"
```

---

## Task 8: Dashboard Overview (superadmin variant)

**Files:**
- Create: `frontend/apps/dashboard/src/components/dashboard/StatCard.tsx`
- Create: `frontend/apps/dashboard/src/pages/superadmin/components/RecentActivityFeed.tsx`
- Create: `frontend/apps/dashboard/src/pages/superadmin/SuperAdminOverview.tsx`
- Modify: `frontend/apps/dashboard/src/pages/OverviewPage.tsx`

- [ ] **Step 1: Create `StatCard.tsx`**

```tsx
import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { IconBadge } from "@paw-match/ui";
import type { IconBadgeTone } from "@paw-match/ui";

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  tone?: IconBadgeTone;
  index?: number;
}

/** Same glass-card language as QuickLinkCard — a compact metric display instead of a navigable link. */
export const StatCard = ({ label, value, icon: Icon, tone = "brand", index = 0 }: StatCardProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.06 }}
      className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl"
    >
      <IconBadge tone={tone}>
        <Icon className="h-6 w-6" aria-hidden />
      </IconBadge>
      <div>
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </motion.div>
  );
};
```

- [ ] **Step 2: Create `pages/superadmin/components/RecentActivityFeed.tsx`**

```tsx
import { Building2, UserPlus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, ListSkeleton } from "@paw-match/ui";
import type { AdminShelter, AdminUser } from "@paw-match/types";

export interface RecentActivityFeedProps {
  shelters: AdminShelter[] | undefined;
  users: AdminUser[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  icon: typeof Building2;
}

const RECENT_SHELTERS_COUNT = 5;
const RECENT_USERS_COUNT = 5;
const MAX_FEED_ITEMS = 8;

/** Derived from the most recently created shelters + users — there is no dedicated activity/audit-log endpoint on the backend. */
const buildActivityItems = (shelters: AdminShelter[], users: AdminUser[]): ActivityItem[] => {
  const shelterItems: ActivityItem[] = shelters.slice(0, RECENT_SHELTERS_COUNT).map((shelter) => ({
    id: `shelter-${shelter._id}`,
    title: `New shelter registered: ${shelter.name}`,
    subtitle: shelter.city,
    createdAt: shelter.createdAt,
    icon: Building2,
  }));

  const userItems: ActivityItem[] = users.slice(0, RECENT_USERS_COUNT).map((user) => ({
    id: `user-${user._id}`,
    title: `New user joined: ${user.firstName} ${user.lastName}`,
    subtitle: user.role,
    createdAt: user.createdAt,
    icon: UserPlus,
  }));

  return [...shelterItems, ...userItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_FEED_ITEMS);
};

/** Not a real activity/audit trail — the backend has no such endpoint. This is a derived approximation from recent shelter/user registrations. */
export const RecentActivityFeed = ({ shelters, users, isLoading, isError, onRetry }: RecentActivityFeedProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  if (isLoading) {
    return <ListSkeleton count={4} label="Loading recent activity" />;
  }

  if (isError) {
    return <ErrorState title="Couldn't load recent activity" onRetry={onRetry} />;
  }

  const items = buildActivityItems(shelters ?? [], users ?? []);

  if (items.length === 0) {
    return <EmptyState title="No recent activity yet" description="New shelters and users will show up here." />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.05 }}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <item.icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
            <p className="truncate text-xs capitalize text-slate-500">{item.subtitle}</p>
          </div>
          <span className="shrink-0 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
        </motion.li>
      ))}
    </ul>
  );
};
```

- [ ] **Step 3: Create `pages/superadmin/SuperAdminOverview.tsx`**

```tsx
import { useMemo } from "react";
import { Building2, ClipboardCheck, ShieldCheck, Users } from "lucide-react";
import { ErrorState } from "@paw-match/ui";
import { QuickLinkCard } from "../../components/dashboard/QuickLinkCard";
import { StatCard } from "../../components/dashboard/StatCard";
import { RecentActivityFeed } from "./components/RecentActivityFeed";
import { shelterAdminHooks } from "../../lib/shelterAdminHooks";
import { userManagementHooks } from "../../lib/userManagementHooks";
import { paths } from "../../routes/paths";

const quickLinks = [
  {
    label: "Shelters",
    description: "Approve, verify, and manage every shelter on Paw Match.",
    to: paths.shelters,
    icon: Building2,
  },
  {
    label: "Users",
    description: "Manage accounts, roles, and account status platform-wide.",
    to: paths.users,
    icon: Users,
  },
];

/** Statistics and recent activity are both derived client-side from the admin shelters/users lists — there is no dashboard-stats or activity-log endpoint on the backend. */
export const SuperAdminOverview = () => {
  const sheltersQuery = shelterAdminHooks.useAdminShelters();
  const usersQuery = userManagementHooks.useAdminUsers();

  const stats = useMemo(() => {
    const shelters = sheltersQuery.data ?? [];
    const users = usersQuery.data ?? [];

    return {
      totalShelters: shelters.length,
      pendingShelters: shelters.filter((shelter) => shelter.verificationStatus === "pending").length,
      activeShelters: shelters.filter((shelter) => shelter.isActive).length,
      totalUsers: users.length,
    };
  }, [sheltersQuery.data, usersQuery.data]);

  const hasStatsError = sheltersQuery.isError || usersQuery.isError;
  const isStatsLoading = sheltersQuery.isLoading || usersQuery.isLoading;

  const handleRetry = () => {
    sheltersQuery.refetch();
    usersQuery.refetch();
  };

  return (
    <div className="mt-8 flex flex-col gap-8">
      {hasStatsError ? (
        <ErrorState title="Couldn't load Dashboard statistics" onRetry={handleRetry} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total shelters" value={isStatsLoading ? "…" : stats.totalShelters} icon={Building2} index={0} />
          <StatCard
            label="Pending approval"
            value={isStatsLoading ? "…" : stats.pendingShelters}
            icon={ClipboardCheck}
            tone="accent"
            index={1}
          />
          <StatCard label="Active shelters" value={isStatsLoading ? "…" : stats.activeShelters} icon={ShieldCheck} index={2} />
          <StatCard label="Total users" value={isStatsLoading ? "…" : stats.totalUsers} icon={Users} tone="accent" index={3} />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
        <div className="mt-4">
          <RecentActivityFeed
            shelters={sheltersQuery.data}
            users={usersQuery.data}
            isLoading={isStatsLoading}
            isError={hasStatsError}
            onRetry={handleRetry}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {quickLinks.map((link, index) => (
            <QuickLinkCard key={link.to} {...link} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Modify `pages/OverviewPage.tsx`**

Replace the entire file content with:
```tsx
import { motion, useReducedMotion } from "framer-motion";
import { Building2, CalendarDays, ClipboardList, PawPrint, Star, UserRound } from "lucide-react";
import { Badge } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { UserRole } from "@paw-match/types";
import { useAuth } from "../lib/auth";
import { paths } from "../routes/paths";
import { QuickLinkCard } from "../components/dashboard/QuickLinkCard";
import { SuperAdminOverview } from "./superadmin/SuperAdminOverview";

const roleBadgeTone: Record<UserRole, BadgeTone> = {
  superadmin: "brand",
  shelterEmployee: "accent",
  vet: "accent",
  adopter: "neutral",
};

const roleLabel: Record<UserRole, string> = {
  superadmin: "Super Admin",
  shelterEmployee: "Shelter Employee",
  vet: "Veterinarian",
  adopter: "Adopter",
};

const quickLinksByRole = {
  shelterEmployee: [
    {
      label: "My Shelter",
      description: "Manage your shelter's profile, logo, and photos.",
      to: paths.myShelter,
      icon: Building2,
    },
    {
      label: "Animals",
      description: "List new animals and keep existing profiles up to date.",
      to: paths.animals,
      icon: PawPrint,
    },
    {
      label: "Adoption Requests",
      description: "Review, interview, and approve incoming requests.",
      to: paths.adoptionRequests,
      icon: ClipboardList,
    },
    {
      label: "Reviews",
      description: "Read and reply to reviews from past adopters.",
      to: paths.reviews,
      icon: Star,
    },
  ],
  vet: [
    {
      label: "My Profile",
      description: "Keep your specialization, bio, and availability current.",
      to: paths.vetProfile,
      icon: UserRound,
    },
    {
      label: "Appointments",
      description: "Schedule requests and manage upcoming consultations.",
      to: paths.appointments,
      icon: CalendarDays,
    },
    {
      label: "Reviews",
      description: "Read and reply to reviews from adopters you've helped.",
      to: paths.reviews,
      icon: Star,
    },
  ],
} as const;

const OverviewPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const auth = useAuth();
  const role = auth.user?.role;

  return (
    <div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-center gap-3"
      >
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back{auth.user ? `, ${auth.user.firstName}` : ""}
        </h1>
        {auth.user && <Badge tone={roleBadgeTone[auth.user.role]}>{roleLabel[auth.user.role]}</Badge>}
      </motion.div>

      {role === "superadmin" ? (
        <SuperAdminOverview />
      ) : (
        <>
          <p className="mt-2 max-w-xl text-slate-600">
            Here's a quick way to get to the things you manage on Paw Match.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(role && role in quickLinksByRole
              ? quickLinksByRole[role as keyof typeof quickLinksByRole]
              : []
            ).map((link, index) => (
              <QuickLinkCard key={link.to} {...link} index={index} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OverviewPage;
```

- [ ] **Step 5: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/apps/dashboard/src/components/dashboard/StatCard.tsx frontend/apps/dashboard/src/pages/superadmin/components/RecentActivityFeed.tsx frontend/apps/dashboard/src/pages/superadmin/SuperAdminOverview.tsx frontend/apps/dashboard/src/pages/OverviewPage.tsx
git commit -m "feat(dashboard): add Super Admin Overview stats, recent activity, and quick actions"
```

---

## Task 9: Shelters Management — dialogs and quick-view

**Files:**
- Create: `frontend/apps/dashboard/src/pages/superadmin/components/RejectShelterDialog.tsx`
- Create: `frontend/apps/dashboard/src/pages/superadmin/components/DeleteShelterDialog.tsx`
- Create: `frontend/apps/dashboard/src/pages/superadmin/components/ShelterQuickViewModal.tsx`

- [ ] **Step 1: Create `RejectShelterDialog.tsx`**

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { rejectShelterSchema } from "@paw-match/validation";
import type { RejectShelterFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { AdminShelter } from "@paw-match/types";
import { shelterAdminHooks } from "../../../lib/shelterAdminHooks";

export interface RejectShelterDialogProps {
  shelter: AdminShelter | null;
  onClose: () => void;
}

export const RejectShelterDialog = ({ shelter, onClose }: RejectShelterDialogProps) => {
  const rejectMutation = shelterAdminHooks.useRejectShelter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectShelterFormValues>({ resolver: zodResolver(rejectShelterSchema) });

  useEffect(() => {
    if (shelter) reset({ reason: "" });
  }, [shelter, reset]);

  const onSubmit = (values: RejectShelterFormValues) => {
    if (!shelter) return;
    rejectMutation.mutate({ id: shelter._id, reason: values.reason }, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(shelter)}
      onClose={onClose}
      title={shelter ? `Reject ${shelter.name}` : "Reject shelter"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={rejectMutation.isPending}>
            Reject shelter
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-slate-600">
          This deactivates the shelter and records why it wasn't approved. A reason is required.
        </p>
        <Textarea label="Rejection reason" rows={4} error={errors.reason?.message} {...register("reason")} />
        {rejectMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(rejectMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
```

- [ ] **Step 2: Create `DeleteShelterDialog.tsx`**

```tsx
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button, Modal } from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { AdminShelter } from "@paw-match/types";
import { shelterAdminHooks } from "../../../lib/shelterAdminHooks";

export interface DeleteShelterDialogProps {
  shelter: AdminShelter | null;
  onClose: () => void;
}

/** Irreversible action — confirm-only dialog, no form fields. The backend remains the sole authority on whether deletion is allowed (inactive + no active adoption requests); its message is shown verbatim on failure. */
export const DeleteShelterDialog = ({ shelter, onClose }: DeleteShelterDialogProps) => {
  const deleteMutation = shelterAdminHooks.useDeleteShelterPermanently();

  const handleConfirm = () => {
    if (!shelter) return;
    deleteMutation.mutate(shelter._id, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(shelter)}
      onClose={onClose}
      title={shelter ? `Delete ${shelter.name} permanently` : "Delete shelter permanently"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          {/* A plain button, not the shared Button component: Button's `variant` prop only offers
              primary/secondary/ghost (all brand-colored or neutral), and layering a red className
              override on top of `variant="primary"`'s own `bg-brand-600` risks an unpredictable
              Tailwind class-cascade conflict (two background-color utilities on one element).
              This mirrors Button's own base/size classes exactly, just red instead of brand. */}
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={handleConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Delete permanently
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
          <p className="text-sm text-red-800">
            This permanently deletes the shelter, its animals, and its adoption-request history. This action
            cannot be undone.
          </p>
        </div>
        {deleteMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(deleteMutation.error)}
          </p>
        )}
      </div>
    </Modal>
  );
};
```

- [ ] **Step 3: Create `ShelterQuickViewModal.tsx`**

```tsx
import { Badge, Modal } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { AdminShelter } from "@paw-match/types";

export interface ShelterQuickViewModalProps {
  shelter: AdminShelter | null;
  onClose: () => void;
}

const verificationTone: Record<AdminShelter["verificationStatus"], BadgeTone> = {
  pending: "neutral",
  approved: "brand",
  rejected: "danger",
};

/** Read-only preview built entirely from data already present in the admin shelters list response — no additional API calls, no new route. */
export const ShelterQuickViewModal = ({ shelter, onClose }: ShelterQuickViewModalProps) => (
  <Modal isOpen={Boolean(shelter)} onClose={onClose} title={shelter?.name ?? "Shelter details"}>
    {shelter && (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone={verificationTone[shelter.verificationStatus]}>{shelter.verificationStatus}</Badge>
          <Badge tone={shelter.isActive ? "accent" : "neutral"}>{shelter.isActive ? "Active" : "Inactive"}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{shelter.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Phone</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{shelter.phone}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Address</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{shelter.address}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">City</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{shelter.city}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Capacity</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{shelter.capacity}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Registered</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{new Date(shelter.createdAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Created by</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {shelter.createdBy.firstName} {shelter.createdBy.lastName}
            </dd>
          </div>
          {shelter.verifiedBy && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Verified by</dt>
              <dd className="mt-0.5 font-medium text-slate-700">
                {shelter.verifiedBy.firstName} {shelter.verifiedBy.lastName}
              </dd>
            </div>
          )}
        </dl>

        {shelter.supportedSpecies.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Supported species</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {shelter.supportedSpecies.map((species) => (
                <Badge key={species} tone="neutral" className="capitalize">
                  {species}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {shelter.description && <p className="text-sm leading-relaxed text-slate-600">{shelter.description}</p>}

        {shelter.rejectionReason && (
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection reason</p>
            <p className="mt-1 text-sm text-red-800">{shelter.rejectionReason}</p>
          </div>
        )}
      </div>
    )}
  </Modal>
);
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors (these three components aren't imported anywhere yet, but must still compile standalone).

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/dashboard/src/pages/superadmin/components/RejectShelterDialog.tsx frontend/apps/dashboard/src/pages/superadmin/components/DeleteShelterDialog.tsx frontend/apps/dashboard/src/pages/superadmin/components/ShelterQuickViewModal.tsx
git commit -m "feat(dashboard): add shelter reject/delete dialogs and quick-view modal"
```

---

## Task 10: Shelters Management — filters, table, and page

**Files:**
- Create: `frontend/apps/dashboard/src/pages/superadmin/components/SheltersFilters.tsx`
- Create: `frontend/apps/dashboard/src/pages/superadmin/components/SheltersTable.tsx`
- Create: `frontend/apps/dashboard/src/pages/superadmin/SheltersPage.tsx`

- [ ] **Step 1: Create `SheltersFilters.tsx`**

```tsx
import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface SheltersFiltersValue {
  search: string;
  verificationStatus: string;
  isActive: string;
}

export interface SheltersFiltersProps {
  value: SheltersFiltersValue;
  onChange: (value: SheltersFiltersValue) => void;
}

const verificationStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const activeStatusOptions = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

/** Every filter here is applied client-side against a single unfiltered fetch — see SheltersPage. */
export const SheltersFilters = ({ value, onChange }: SheltersFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-3">
    <Input
      label="Search shelters"
      hideLabel
      placeholder="Search by name, email, or city"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
    />
    <Select
      label="Verification status"
      hideLabel
      placeholder="All verification statuses"
      options={verificationStatusOptions}
      value={value.verificationStatus}
      onChange={(event) => onChange({ ...value, verificationStatus: event.target.value })}
    />
    <Select
      label="Active status"
      hideLabel
      placeholder="All active statuses"
      options={activeStatusOptions}
      value={value.isActive}
      onChange={(event) => onChange({ ...value, isActive: event.target.value })}
    />
  </div>
);
```

- [ ] **Step 2: Create `SheltersTable.tsx`**

```tsx
import { useState } from "react";
import { CheckCircle2, Eye, PauseCircle, PlayCircle as ActivateIcon, Trash2, XCircle } from "lucide-react";
import {
  Badge,
  Button,
  RowActionsMenu,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  VisuallyHidden,
} from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { AdminShelter } from "@paw-match/types";
import { shelterAdminHooks } from "../../../lib/shelterAdminHooks";
import { RejectShelterDialog } from "./RejectShelterDialog";
import { DeleteShelterDialog } from "./DeleteShelterDialog";
import { ShelterQuickViewModal } from "./ShelterQuickViewModal";

const verificationTone: Record<AdminShelter["verificationStatus"], BadgeTone> = {
  pending: "neutral",
  approved: "brand",
  rejected: "danger",
};

const verificationLabel: Record<AdminShelter["verificationStatus"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export interface SheltersTableProps {
  shelters: AdminShelter[];
}

export const SheltersTable = ({ shelters }: SheltersTableProps) => {
  const [rejectTarget, setRejectTarget] = useState<AdminShelter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminShelter | null>(null);
  const [viewTarget, setViewTarget] = useState<AdminShelter | null>(null);

  const approveMutation = shelterAdminHooks.useApproveShelter();
  const toggleStatusMutation = shelterAdminHooks.useToggleShelterStatus();

  return (
    <>
      <Table>
        <TableHead>
          <TableHeaderCell>Shelter</TableHeaderCell>
          <TableHeaderCell>City</TableHeaderCell>
          <TableHeaderCell>Verification</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Registered</TableHeaderCell>
          <TableHeaderCell>
            <VisuallyHidden>Actions</VisuallyHidden>
          </TableHeaderCell>
        </TableHead>
        <TableBody>
          {shelters.map((shelter) => {
            const canActivate = shelter.isActive || shelter.verificationStatus === "approved";

            return (
              <TableRow key={shelter._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {shelter.logo ? (
                      <img src={shelter.logo.url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {shelter.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{shelter.name}</p>
                      <p className="truncate text-xs text-slate-500">{shelter.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{shelter.city}</TableCell>
                <TableCell>
                  <Badge tone={verificationTone[shelter.verificationStatus]}>
                    {verificationLabel[shelter.verificationStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge tone={shelter.isActive ? "accent" : "neutral"}>
                    {shelter.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(shelter.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    {shelter.verificationStatus === "pending" && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={approveMutation.isPending && approveMutation.variables === shelter._id}
                          onClick={() => approveMutation.mutate(shelter._id)}
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Approve
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setRejectTarget(shelter)}>
                          <XCircle className="h-4 w-4" aria-hidden />
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!canActivate}
                      title={!canActivate ? "Approve the shelter before activating it" : undefined}
                      isLoading={toggleStatusMutation.isPending && toggleStatusMutation.variables === shelter._id}
                      onClick={() => toggleStatusMutation.mutate(shelter._id)}
                    >
                      {shelter.isActive ? (
                        <>
                          <PauseCircle className="h-4 w-4" aria-hidden />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ActivateIcon className="h-4 w-4" aria-hidden />
                          Activate
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setViewTarget(shelter)}
                      aria-label={`View ${shelter.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                    </button>

                    <RowActionsMenu
                      label={`More actions for ${shelter.name}`}
                      actions={[
                        {
                          label: "Delete permanently",
                          icon: Trash2,
                          tone: "danger",
                          disabled: shelter.isActive,
                          disabledReason: "Deactivate the shelter before deleting it permanently",
                          onClick: () => setDeleteTarget(shelter),
                        },
                      ]}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <RejectShelterDialog shelter={rejectTarget} onClose={() => setRejectTarget(null)} />
      <DeleteShelterDialog shelter={deleteTarget} onClose={() => setDeleteTarget(null)} />
      <ShelterQuickViewModal shelter={viewTarget} onClose={() => setViewTarget(null)} />
    </>
  );
};
```

Note: `PlayCircle` is imported once, aliased as `ActivateIcon`, so the "Activate" button's icon has a name distinct from `PauseCircle`'s usage in the same file.

- [ ] **Step 3: Create `SheltersPage.tsx`**

```tsx
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, Pagination, TableSkeleton } from "@paw-match/ui";
import { shelterAdminHooks } from "../../lib/shelterAdminHooks";
import { SheltersFilters } from "./components/SheltersFilters";
import type { SheltersFiltersValue } from "./components/SheltersFilters";
import { SheltersTable } from "./components/SheltersTable";

const PAGE_SIZE = 10;
const SHELTERS_TABLE_COLUMN_COUNT = 6;

const emptyFilters: SheltersFiltersValue = { search: "", verificationStatus: "", isActive: "" };

const SheltersPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const sheltersQuery = shelterAdminHooks.useAdminShelters();
  const [filters, setFilters] = useState<SheltersFiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);

  const filteredShelters = useMemo(() => {
    const shelters = sheltersQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    return shelters.filter((shelter) => {
      const matchesSearch =
        search.length === 0 ||
        shelter.name.toLowerCase().includes(search) ||
        shelter.email.toLowerCase().includes(search) ||
        shelter.city.toLowerCase().includes(search);

      const matchesVerification =
        filters.verificationStatus.length === 0 || shelter.verificationStatus === filters.verificationStatus;

      const matchesActive = filters.isActive.length === 0 || String(shelter.isActive) === filters.isActive;

      return matchesSearch && matchesVerification && matchesActive;
    });
  }, [sheltersQuery.data, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredShelters.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredShelters.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: SheltersFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Shelters</h1>
      <p className="mt-2 max-w-xl text-slate-600">Approve, verify, and manage every shelter on Paw Match.</p>

      <div className="mt-6">
        <SheltersFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {sheltersQuery.isLoading && <TableSkeleton columns={SHELTERS_TABLE_COLUMN_COUNT} rows={PAGE_SIZE} />}

        {sheltersQuery.isError && <ErrorState title="Couldn't load shelters" onRetry={() => sheltersQuery.refetch()} />}

        {sheltersQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No shelters match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {sheltersQuery.isSuccess && pageItems.length > 0 && (
          <>
            <SheltersTable shelters={pageItems} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SheltersPage;
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/dashboard/src/pages/superadmin/components/SheltersFilters.tsx frontend/apps/dashboard/src/pages/superadmin/components/SheltersTable.tsx frontend/apps/dashboard/src/pages/superadmin/SheltersPage.tsx
git commit -m "feat(dashboard): add Shelters Management page"
```

---

## Task 11: Users Management — dialogs and quick-view

**Files:**
- Create: `frontend/apps/dashboard/src/pages/superadmin/components/ChangeRoleDialog.tsx`
- Create: `frontend/apps/dashboard/src/pages/superadmin/components/UserQuickViewModal.tsx`

- [ ] **Step 1: Create `ChangeRoleDialog.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Button, Modal, Select } from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { AdminUser, UserRole } from "@paw-match/types";
import { userManagementHooks } from "../../../lib/userManagementHooks";

export interface ChangeRoleDialogProps {
  user: AdminUser | null;
  onClose: () => void;
}

const roleOptions: { label: string; value: Exclude<UserRole, "superadmin"> }[] = [
  { label: "Shelter Employee", value: "shelterEmployee" },
  { label: "Veterinarian", value: "vet" },
  { label: "Adopter", value: "adopter" },
];

/** Only reachable for non-superadmin rows (see UsersTable) — the backend also rejects a role change on a superadmin account with a 403. */
export const ChangeRoleDialog = ({ user, onClose }: ChangeRoleDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, "superadmin">>("adopter");
  const roleMutation = userManagementHooks.useUpdateUserRole();

  useEffect(() => {
    if (user && user.role !== "superadmin") setSelectedRole(user.role);
  }, [user]);

  const handleConfirm = () => {
    if (!user) return;
    roleMutation.mutate({ id: user._id, role: selectedRole }, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(user)}
      onClose={onClose}
      title={user ? `Change role for ${user.firstName} ${user.lastName}` : "Change role"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={roleMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} isLoading={roleMutation.isPending}>
            Save role
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Role"
          options={roleOptions}
          value={selectedRole}
          onChange={(event) => setSelectedRole(event.target.value as Exclude<UserRole, "superadmin">)}
        />
        {roleMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(roleMutation.error)}
          </p>
        )}
      </div>
    </Modal>
  );
};
```

- [ ] **Step 2: Create `UserQuickViewModal.tsx`**

```tsx
import { Badge, Modal, UserAvatar } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { AdminUser } from "@paw-match/types";

export interface UserQuickViewModalProps {
  user: AdminUser | null;
  onClose: () => void;
}

const roleTone: Record<AdminUser["role"], BadgeTone> = {
  superadmin: "brand",
  shelterEmployee: "accent",
  vet: "accent",
  adopter: "neutral",
};

const roleLabel: Record<AdminUser["role"], string> = {
  superadmin: "Super Admin",
  shelterEmployee: "Shelter Employee",
  vet: "Veterinarian",
  adopter: "Adopter",
};

/** Read-only preview built entirely from data already present in the admin users list response — no additional API calls, no new route. */
export const UserQuickViewModal = ({ user, onClose }: UserQuickViewModalProps) => (
  <Modal isOpen={Boolean(user)} onClose={onClose} title={user ? `${user.firstName} ${user.lastName}` : "User details"}>
    {user && (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar firstName={user.firstName} lastName={user.lastName} profileImage={user.profileImage} />
          <div className="flex flex-wrap gap-2">
            <Badge tone={roleTone[user.role]}>{roleLabel[user.role]}</Badge>
            <Badge tone={user.isActive ? "accent" : "neutral"}>{user.isActive ? "Active" : "Inactive"}</Badge>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{user.email}</dd>
          </div>
          {user.phone && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Phone</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{user.phone}</dd>
            </div>
          )}
          {user.address && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Address</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{user.address}</dd>
            </div>
          )}
          {user.gender && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Gender</dt>
              <dd className="mt-0.5 font-medium capitalize text-slate-700">{user.gender}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Joined</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{new Date(user.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>
    )}
  </Modal>
);
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/dashboard/src/pages/superadmin/components/ChangeRoleDialog.tsx frontend/apps/dashboard/src/pages/superadmin/components/UserQuickViewModal.tsx
git commit -m "feat(dashboard): add change-role dialog and user quick-view modal"
```

---

## Task 12: Users Management — filters, table, and page

**Files:**
- Create: `frontend/apps/dashboard/src/pages/superadmin/components/UsersFilters.tsx`
- Create: `frontend/apps/dashboard/src/pages/superadmin/components/UsersTable.tsx`
- Create: `frontend/apps/dashboard/src/pages/superadmin/UsersPage.tsx`

- [ ] **Step 1: Create `UsersFilters.tsx`**

```tsx
import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface UsersFiltersValue {
  search: string;
  role: string;
  isActive: string;
}

export interface UsersFiltersProps {
  value: UsersFiltersValue;
  onChange: (value: UsersFiltersValue) => void;
}

const roleOptions = [
  { label: "Super Admin", value: "superadmin" },
  { label: "Shelter Employee", value: "shelterEmployee" },
  { label: "Veterinarian", value: "vet" },
  { label: "Adopter", value: "adopter" },
];

const activeStatusOptions = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

/** Every filter here is applied client-side against a single unfiltered fetch — GET /user has no query params at all. */
export const UsersFilters = ({ value, onChange }: UsersFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-3">
    <Input
      label="Search users"
      hideLabel
      placeholder="Search by name or email"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
    />
    <Select
      label="Role"
      hideLabel
      placeholder="All roles"
      options={roleOptions}
      value={value.role}
      onChange={(event) => onChange({ ...value, role: event.target.value })}
    />
    <Select
      label="Active status"
      hideLabel
      placeholder="All active statuses"
      options={activeStatusOptions}
      value={value.isActive}
      onChange={(event) => onChange({ ...value, isActive: event.target.value })}
    />
  </div>
);
```

- [ ] **Step 2: Create `UsersTable.tsx`**

```tsx
import { useState } from "react";
import { Eye, PauseCircle, PlayCircle, UserCog } from "lucide-react";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  UserAvatar,
  VisuallyHidden,
} from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { AdminUser } from "@paw-match/types";
import { userManagementHooks } from "../../../lib/userManagementHooks";
import { useAuth } from "../../../lib/auth";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { UserQuickViewModal } from "./UserQuickViewModal";

const roleTone: Record<AdminUser["role"], BadgeTone> = {
  superadmin: "brand",
  shelterEmployee: "accent",
  vet: "accent",
  adopter: "neutral",
};

const roleLabel: Record<AdminUser["role"], string> = {
  superadmin: "Super Admin",
  shelterEmployee: "Shelter Employee",
  vet: "Veterinarian",
  adopter: "Adopter",
};

export interface UsersTableProps {
  users: AdminUser[];
}

export const UsersTable = ({ users }: UsersTableProps) => {
  const auth = useAuth();
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [viewTarget, setViewTarget] = useState<AdminUser | null>(null);

  const statusMutation = userManagementHooks.useUpdateUserStatus();

  return (
    <>
      <Table>
        <TableHead>
          <TableHeaderCell>User</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>
            <VisuallyHidden>Actions</VisuallyHidden>
          </TableHeaderCell>
        </TableHead>
        <TableBody>
          {users.map((user) => {
            const isSelf = auth.user?._id === user._id;
            const isSuperadmin = user.role === "superadmin";
            const deactivateDisabled = isSelf || (isSuperadmin && user.isActive);
            const deactivateDisabledReason = isSelf
              ? "You cannot change your own account status"
              : "Superadmin accounts cannot be deactivated";

            return (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      firstName={user.firstName}
                      lastName={user.lastName}
                      profileImage={user.profileImage}
                      size="sm"
                    />
                    <p className="truncate font-medium text-slate-900">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{user.email}</TableCell>
                <TableCell>
                  <Badge tone={roleTone[user.role]}>{roleLabel[user.role]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge tone={user.isActive ? "accent" : "neutral"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isSuperadmin}
                      title={isSuperadmin ? "Superadmin roles cannot be changed" : undefined}
                      onClick={() => setRoleTarget(user)}
                    >
                      <UserCog className="h-4 w-4" aria-hidden />
                      Change role
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={deactivateDisabled}
                      title={deactivateDisabled ? deactivateDisabledReason : undefined}
                      isLoading={statusMutation.isPending && statusMutation.variables?.id === user._id}
                      onClick={() => statusMutation.mutate({ id: user._id, isActive: !user.isActive })}
                    >
                      {user.isActive ? (
                        <>
                          <PauseCircle className="h-4 w-4" aria-hidden />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4" aria-hidden />
                          Activate
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setViewTarget(user)}
                      aria-label={`View ${user.firstName} ${user.lastName}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ChangeRoleDialog user={roleTarget} onClose={() => setRoleTarget(null)} />
      <UserQuickViewModal user={viewTarget} onClose={() => setViewTarget(null)} />
    </>
  );
};
```

- [ ] **Step 3: Create `UsersPage.tsx`**

```tsx
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, Pagination, TableSkeleton } from "@paw-match/ui";
import { userManagementHooks } from "../../lib/userManagementHooks";
import { UsersFilters } from "./components/UsersFilters";
import type { UsersFiltersValue } from "./components/UsersFilters";
import { UsersTable } from "./components/UsersTable";

const PAGE_SIZE = 10;
const USERS_TABLE_COLUMN_COUNT = 5;

const emptyFilters: UsersFiltersValue = { search: "", role: "", isActive: "" };

const UsersPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const usersQuery = userManagementHooks.useAdminUsers();
  const [filters, setFilters] = useState<UsersFiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesSearch = search.length === 0 || fullName.includes(search) || user.email.toLowerCase().includes(search);
      const matchesRole = filters.role.length === 0 || user.role === filters.role;
      const matchesActive = filters.isActive.length === 0 || String(user.isActive) === filters.isActive;

      return matchesSearch && matchesRole && matchesActive;
    });
  }, [usersQuery.data, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: UsersFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Users</h1>
      <p className="mt-2 max-w-xl text-slate-600">Manage accounts, roles, and account status platform-wide.</p>

      <div className="mt-6">
        <UsersFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {usersQuery.isLoading && <TableSkeleton columns={USERS_TABLE_COLUMN_COUNT} rows={PAGE_SIZE} />}

        {usersQuery.isError && <ErrorState title="Couldn't load users" onRetry={() => usersQuery.refetch()} />}

        {usersQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No users match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {usersQuery.isSuccess && pageItems.length > 0 && (
          <>
            <UsersTable users={pageItems} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default UsersPage;
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/dashboard/src/pages/superadmin/components/UsersFilters.tsx frontend/apps/dashboard/src/pages/superadmin/components/UsersTable.tsx frontend/apps/dashboard/src/pages/superadmin/UsersPage.tsx
git commit -m "feat(dashboard): add Users Management page"
```

---

## Task 13: Wire the new pages into routing

**Files:**
- Modify: `frontend/apps/dashboard/src/App.tsx`

- [ ] **Step 1: Add lazy imports**

In `frontend/apps/dashboard/src/App.tsx`, add these two lines alongside the other `lazy(() => import(...))` declarations near the top of the file (after the `NotFoundPage` lazy import line):
```tsx
const SheltersPage = lazy(() => import("./pages/superadmin/SheltersPage"));
const UsersPage = lazy(() => import("./pages/superadmin/UsersPage"));
```

- [ ] **Step 2: Replace the `ComingSoonPage` routes for `shelters`/`users`**

Find this block (inside the `superadmin`-gated `<Route>`):
```tsx
            <Route element={<RequireRole roles={["superadmin"]} redirectTo={paths.home} />}>
              <Route
                path="shelters"
                element={<ComingSoonPage title="Shelters" description="Approve, verify, and manage every shelter on Paw Match." />}
              />
              <Route
                path="users"
                element={<ComingSoonPage title="Users" description="Manage accounts, roles, and account status platform-wide." />}
              />
            </Route>
```
Replace it with:
```tsx
            <Route element={<RequireRole roles={["superadmin"]} redirectTo={paths.home} />}>
              <Route path="shelters" element={<SheltersPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/dashboard/src/App.tsx
git commit -m "feat(dashboard): route Shelters and Users to the new Super Admin pages"
```

---

## Task 14: Full workspace verification

**Files:** none (verification only)

- [ ] **Step 1: Full workspace typecheck**

Run: `cd frontend && npm run typecheck`
Expected: every workspace (`dashboard`, `public-web`, `api-client`, `auth`, `hooks`, `types`, `ui`, `utilities`, `validation`) reports zero errors.

- [ ] **Step 2: Dashboard production build**

Run: `cd frontend && npm run build --workspace=@paw-match/dashboard`
Expected: build succeeds, no errors.

- [ ] **Step 3: Public Website production build (must remain unaffected)**

Run: `cd frontend && npm run build --workspace=@paw-match/public-web`
Expected: build succeeds, no errors — confirms nothing in `packages/*` broke the other app.

- [ ] **Step 4: Manual dev-server verification**

Run: `cd frontend/apps/dashboard && npx vite --port <a free port>` (in the background), then, while it's running:
- Sign in as a superadmin account and confirm `/` shows Welcome header, 4 stat cards, a Recent Activity section (feed, or its empty/error state), and 2 Quick Action cards.
- Visit `/shelters`: confirm the table loads with search/verification/active filters, row actions behave (Approve/Reject on pending shelters, Activate/Deactivate elsewhere, View opens the quick-view modal, the overflow menu's Delete permanently is disabled with a tooltip on active shelters and opens the confirm dialog on inactive ones), and empty-filter/loading/error states render correctly.
- Visit `/users`: confirm the table loads with search/role/active filters, Change role opens its dialog (disabled for the superadmin row), Activate/Deactivate is disabled on your own row and on other superadmin rows, View opens the quick-view modal.
- Confirm signing in as `shelterEmployee` or `vet` still shows the original (unchanged) Overview quick-links view, and that visiting `/shelters` or `/users` as either role redirects to `/unauthorized`.
- Stop the dev server afterward.

- [ ] **Step 5: Responsive check**

With the dev server running, check the Shelters and Users pages at 375px, 768px, 1024px, and 1440px widths: confirm no horizontal page overflow (tables scroll inside their own container), filters stack sensibly on narrow widths, and the Overview stat-card grid reflows (1 → 2 → 4 columns).

- [ ] **Step 6: Report results**

Summarize: typecheck result, both build results, and what was manually verified vs. anything that couldn't be verified (e.g. actually triggering a 409 "active adoption requests" delete failure requires seed data this plan doesn't create).

---

## Self-review notes (completed during planning, not a task to execute)

- **Spec coverage:** Overview (stats/activity/quick-actions) → Task 8. Shelters table/search/filters/pagination/badges/row-actions/empty/loading/error → Tasks 9–10. Users table/search/filters/pagination/badges/row-actions/empty/loading/error → Tasks 11–12. Shared Modal/Table/TableSkeleton/RowActionsMenu → Tasks 5–7. Client-side data operations, 10-rows-per-page, derived recent activity, quick-view modals, destructive delete flow → all reflected in the tasks above exactly as approved.
- **No placeholders:** every step shows complete file content or an exact diff; no "add error handling" or "TBD" phrasing appears.
- **Type consistency:** `AdminShelter`/`AdminShelterRef` (Task 1) are the only shelter admin types referenced in Tasks 3, 9, 10. `AdminUser`/`UpdateUserRoleResult`/`UpdateUserStatusResult` (Task 1) are the only user admin types referenced in Tasks 3, 11, 12. Hook names (`shelterAdminHooks.useApproveShelter`, etc.) are defined once in Task 4 and used with identical names/signatures in Tasks 9–12. Mutation variable shapes (`{id, reason}`, `{id, isActive}`, `{id, role}`) match between the hook definitions (Task 4) and every call site (Tasks 9, 11, 12).
