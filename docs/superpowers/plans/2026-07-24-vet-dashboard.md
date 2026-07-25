# Vet Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Vet's Overview, My Profile (fully editable), and Appointments Management pages
per the approved design (`docs/superpowers/specs/2026-07-24-vet-dashboard-design.md`), using only
existing, confirmed backend endpoints.

**Architecture:** A new data layer (types → validation → api-client → hooks) mirrors the exact
separate-file convention established in Phases 2-3 — new files for vet-self-service profile and
vet-scoped appointment operations, never modifying the existing adopter-facing files. No new shared
UI components are needed this phase (confirmed in the design spec) — everything reuses what Phases
1-3 already built, including Phase 3's `ImageUploader` for the profile-photo flow. Everything else is
Dashboard-specific under `apps/dashboard/src/pages/vet/`.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Framer Motion, TanStack Query v5, React Hook
Form + Zod, React Router v7 — all already in place; no new dependencies.

**Verification approach:** No test framework exists in this repo (confirmed in Phases 2-3's plans and
still true). Each task ends with a typecheck checkpoint instead of a test run; a full manual
verification pass closes the plan.

**Two confirmed facts shape this plan's scope:**
1. Unlike Phase 3's shelter-employee Manager-gate bug, **no comparable bug exists for vet** —
   `GET/PUT /vet-profile/me` and the vet-appointment endpoints all work exactly as documented, so My
   Profile is a real, fully-editable page (not read-only like Phase 3's My Shelter).
2. `VetProfile.averageRating`/`totalReviews` are never actually persisted server-side (the schema
   doesn't declare them) — My Profile computes its own rating summary client-side from the embedded
   `reviews` array using the existing `getAverageRating` utility in `packages/utilities`, never
   trusting those two fields.

---

## Backend endpoints used (all pre-existing, none modified)

| Endpoint | Method | Used for |
|---|---|---|
| `/vet-profile/me` | GET | My Profile display, Overview context |
| `/vet-profile/me` | PUT | My Profile edit (specialization/bio/experienceYears/availableDays/consultationTypes) |
| `/user/profile/image`, `/user/profile/image/replace`, `/user/profile/image/` (DELETE) | PATCH/PATCH/DELETE | Profile photo — reuses the existing generic, role-agnostic endpoints unchanged |
| `/vetappointments/vet` | GET | Appointments Management list + Overview stats (server-side `status` filter only) |
| `/vetappointments/:id/schedule` | PATCH | Schedule a pending request |
| `/vetappointments/:id/status` | PATCH | Complete or reject a scheduled appointment |

No endpoint is invented. No backend file is modified.

---

## File inventory

**New — data layer (types, modifying existing files — no new type files needed):**
- `frontend/packages/types/src/vetProfile.ts` (modified — add `UpdateVetProfilePayload`)
- `frontend/packages/types/src/vetAppointment.ts` (modified — add `ScheduleVetAppointmentPayload`, `UpdateVetAppointmentStatusPayload`)

**New — data layer (validation):**
- `frontend/packages/validation/src/vetProfile.ts` (new)
- `frontend/packages/validation/src/vetAppointmentVet.ts` (new)
- `frontend/packages/validation/src/index.ts` (modified)

**New — data layer (api-client):**
- `frontend/packages/api-client/src/vetProfileSelf.ts` (new)
- `frontend/packages/api-client/src/vetAppointmentVet.ts` (new)
- `frontend/packages/api-client/src/index.ts` (modified)

**New — data layer (hooks):**
- `frontend/packages/hooks/src/vetProfileSelf.ts` (new)
- `frontend/packages/hooks/src/vetAppointmentVet.ts` (new)
- `frontend/packages/hooks/src/index.ts` (modified)

**New — Dashboard lib wiring:**
- `frontend/apps/dashboard/src/lib/vetProfileSelfHooks.ts` (new)
- `frontend/apps/dashboard/src/lib/vetAppointmentVetHooks.ts` (new)
- `frontend/apps/dashboard/src/lib/userAccountHooks.ts` (new — wraps the existing
  `createUserAccountHooks`, reused unchanged for the profile-photo flow; the Dashboard app has never
  wired this factory before, only `apps/public-web` has)

**New — Overview:**
- `frontend/apps/dashboard/src/pages/vet/components/RecentAppointmentsFeed.tsx` (new)
- `frontend/apps/dashboard/src/pages/vet/VetOverview.tsx` (new)
- `frontend/apps/dashboard/src/pages/OverviewPage.tsx` (modified — third role branch, generic
  quick-links fallback removed since every real role now has an explicit branch)

**New — My Profile:**
- `frontend/apps/dashboard/src/pages/vet/MyProfilePage.tsx` (new)

**New — Appointments Management:**
- `frontend/apps/dashboard/src/pages/vet/components/AppointmentsFilters.tsx` (new)
- `frontend/apps/dashboard/src/pages/vet/components/AppointmentQuickViewModal.tsx` (new)
- `frontend/apps/dashboard/src/pages/vet/components/ScheduleAppointmentDialog.tsx` (new)
- `frontend/apps/dashboard/src/pages/vet/components/CompleteAppointmentDialog.tsx` (new)
- `frontend/apps/dashboard/src/pages/vet/components/RejectAppointmentDialog.tsx` (new)
- `frontend/apps/dashboard/src/pages/vet/components/AppointmentsTable.tsx` (new)
- `frontend/apps/dashboard/src/pages/vet/AppointmentsPage.tsx` (new)

**Modified — routing:**
- `frontend/apps/dashboard/src/App.tsx` (modified — `vet-profile`/`appointments` routes swap
  `ComingSoonPage` for the two real pages; `reviews` and every other placeholder stay untouched)

No file outside `frontend/` is touched. No backend file is touched. No shared `packages/ui`
component is created or modified this phase.

---

## Task 1: Types

**Files:**
- Modify: `frontend/packages/types/src/vetProfile.ts`
- Modify: `frontend/packages/types/src/vetAppointment.ts`

- [ ] **Step 1: Add `UpdateVetProfilePayload` to `vetProfile.ts`**

Append to the end of `frontend/packages/types/src/vetProfile.ts`:
```ts

/**
 * PUT /vet-profile/me body — the same 5 fields updateMyProfile whitelists
 * (src/controllers/vetProfile.controller.js). The backend 400s if any other
 * key is present, or if the body is empty (at least one field required) —
 * neither constraint is expressible in this type; both are enforced by the
 * form/zod schema instead, same convention as every other "at least one
 * field" backend rule in this codebase.
 */
export interface UpdateVetProfilePayload {
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  availableDays?: WeekDay[];
  consultationTypes?: ConsultationType[];
}
```

- [ ] **Step 2: Add appointment payload types to `vetAppointment.ts`**

Append to the end of `frontend/packages/types/src/vetAppointment.ts`:
```ts

/** PATCH /vetappointments/:id/schedule body — only valid when the appointment's current status is "pending". */
export interface ScheduleVetAppointmentPayload {
  appointmentDate: string;
  duration?: number;
  vetNotes?: string;
}

/** PATCH /vetappointments/:id/status body — only valid when the appointment's current status is "scheduled"; rejectionReason required only when status is "rejected". */
export interface UpdateVetAppointmentStatusPayload {
  status: "completed" | "rejected";
  vetNotes?: string;
  rejectionReason?: string;
}
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/types`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/packages/types/src/vetProfile.ts frontend/packages/types/src/vetAppointment.ts
git commit -m "feat(types): add vet self-service profile and appointment payload types"
```

---

## Task 2: Validation schemas

**Files:**
- Create: `frontend/packages/validation/src/vetProfile.ts`
- Create: `frontend/packages/validation/src/vetAppointmentVet.ts`
- Modify: `frontend/packages/validation/src/index.ts`

- [ ] **Step 1: Create the vet profile form schema**

```ts
/**
 * Zod schema mirroring src/validation/vetProfile.validate.js's
 * updateMyProfileValidation. `experienceYears` is required here (not
 * optional) since the form always displays and resubmits the vet's current
 * value — this is an in-place edit form, not a partial-diff PATCH form.
 */
import { z } from "zod";

export const vetProfileFormSchema = z.object({
  specialization: z
    .string()
    .trim()
    .min(2, "Specialization must be between 2 and 100 characters")
    .max(100, "Specialization must be between 2 and 100 characters")
    .optional()
    .or(z.literal("")),
  bio: z.string().trim().max(1000, "Bio cannot exceed 1000 characters").optional().or(z.literal("")),
  experienceYears: z
    .number({ message: "Experience years is required" })
    .min(0, "Experience years cannot be negative")
    .max(80, "Experience years cannot exceed 80"),
  availableDays: z.array(
    z.enum(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]),
  ),
  consultationTypes: z.array(z.enum(["vetConsultation", "behaviorTraining"])),
});

export type VetProfileFormValues = z.infer<typeof vetProfileFormSchema>;
```

- [ ] **Step 2: Create the appointment action schemas**

```ts
/**
 * Zod schemas mirroring src/validation/vetAppointment.validate.js's
 * scheduleAppointmentValidation and updateAppointmentStatusValidation.
 */
import { z } from "zod";

export const scheduleAppointmentSchema = z.object({
  appointmentDate: z.string().min(1, "Date and time are required"),
  duration: z
    .number({ message: "Duration is required" })
    .min(15, "Duration must be between 15 and 180 minutes")
    .max(180, "Duration must be between 15 and 180 minutes"),
  vetNotes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type ScheduleAppointmentFormValues = z.infer<typeof scheduleAppointmentSchema>;

export const completeAppointmentSchema = z.object({
  vetNotes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type CompleteAppointmentFormValues = z.infer<typeof completeAppointmentSchema>;

export const rejectAppointmentSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(1, "A reason is required")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type RejectAppointmentFormValues = z.infer<typeof rejectAppointmentSchema>;
```

- [ ] **Step 3: Export both**

Add to `frontend/packages/validation/src/index.ts` (after `export * from "./adoptionRequestShelter";`):
```ts
export * from "./vetProfile";
export * from "./vetAppointmentVet";
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/validation`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/packages/validation/src/vetProfile.ts frontend/packages/validation/src/vetAppointmentVet.ts frontend/packages/validation/src/index.ts
git commit -m "feat(validation): add vet profile and appointment action schemas"
```

---

## Task 3: api-client functions

**Files:**
- Create: `frontend/packages/api-client/src/vetProfileSelf.ts`
- Create: `frontend/packages/api-client/src/vetAppointmentVet.ts`
- Modify: `frontend/packages/api-client/src/index.ts`

- [ ] **Step 1: Create `vetProfileSelf.ts`**

```ts
/**
 * Vet-only self-service endpoint functions for
 * src/routes/profiles/vetProfile.routes.js's GET /me and PUT /me. Kept
 * separate from ./vetProfiles.ts, which is documented there as the
 * general-read (any authenticated role) subset only.
 */
import type { AxiosInstance } from "axios";
import type { UpdateVetProfilePayload, VetProfile } from "@paw-match/types";

/** GET /vet-profile/me — 404 if no profile exists. Includes an embedded reviews array (already-published reviews targeting this vet). */
export const getMyVetProfile = async (client: AxiosInstance): Promise<VetProfile> => {
  const { data } = await client.get<{ success: true; message: string; data: VetProfile }>(
    "/vet-profile/me",
  );
  return data.data;
};

/** PUT /vet-profile/me — whitelisted fields only (specialization/bio/experienceYears/availableDays/consultationTypes); 400 if any other field is present or if the body is empty. */
export const updateMyVetProfile = async (
  client: AxiosInstance,
  payload: UpdateVetProfilePayload,
): Promise<VetProfile> => {
  const { data } = await client.put<{ success: true; message: string; data: VetProfile }>(
    "/vet-profile/me",
    payload,
  );
  return data.data;
};
```

- [ ] **Step 2: Create `vetAppointmentVet.ts`**

```ts
/**
 * Vet-only endpoint functions for the vet-facing subset of
 * src/routes/vetAppointment.route.js. Kept separate from
 * ./vetAppointments.ts, which is documented there as the adopter-facing
 * subset only.
 */
import type { AxiosInstance } from "axios";
import type {
  ScheduleVetAppointmentPayload,
  UpdateVetAppointmentStatusPayload,
  VetAppointment,
  VetAppointmentStatus,
} from "@paw-match/types";

export interface VetAppointmentsFilters {
  status?: VetAppointmentStatus;
}

/** GET /vetappointments/vet — hard-scoped server-side to the caller's own vetId (their own User id); no search, no pagination. */
export const getVetAppointments = async (
  client: AxiosInstance,
  filters: VetAppointmentsFilters = {},
): Promise<VetAppointment[]> => {
  const { data } = await client.get<{ success: true; count: number; data: VetAppointment[] }>(
    "/vetappointments/vet",
    { params: filters },
  );
  return data.data;
};

/** PATCH /vetappointments/:id/schedule — only valid when the appointment's current status is "pending"; 409 on a scheduling conflict with another of the vet's own scheduled appointments. */
export const scheduleVetAppointment = async (
  client: AxiosInstance,
  id: string,
  payload: ScheduleVetAppointmentPayload,
): Promise<VetAppointment> => {
  const { data } = await client.patch<{ success: true; message: string; data: VetAppointment }>(
    `/vetappointments/${id}/schedule`,
    payload,
  );
  return data.data;
};

/** PATCH /vetappointments/:id/status — only valid when the appointment's current status is "scheduled"; rejectionReason required only when status is "rejected". */
export const updateVetAppointmentStatus = async (
  client: AxiosInstance,
  id: string,
  payload: UpdateVetAppointmentStatusPayload,
): Promise<VetAppointment> => {
  const { data } = await client.patch<{ success: true; message: string; data: VetAppointment }>(
    `/vetappointments/${id}/status`,
    payload,
  );
  return data.data;
};
```

- [ ] **Step 3: Export both**

Add to `frontend/packages/api-client/src/index.ts` (after `export * from "./shelterEmployeeShelter";`):
```ts
export * from "./vetProfileSelf";
export * from "./vetAppointmentVet";
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/api-client`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/packages/api-client/src/vetProfileSelf.ts frontend/packages/api-client/src/vetAppointmentVet.ts frontend/packages/api-client/src/index.ts
git commit -m "feat(api-client): add vet self-service profile and appointment endpoints"
```

---

## Task 4: Query/mutation hooks

**Files:**
- Create: `frontend/packages/hooks/src/vetProfileSelf.ts`
- Create: `frontend/packages/hooks/src/vetAppointmentVet.ts`
- Modify: `frontend/packages/hooks/src/index.ts`
- Create: `frontend/apps/dashboard/src/lib/vetProfileSelfHooks.ts`
- Create: `frontend/apps/dashboard/src/lib/vetAppointmentVetHooks.ts`
- Create: `frontend/apps/dashboard/src/lib/userAccountHooks.ts`

- [ ] **Step 1: Create `packages/hooks/src/vetProfileSelf.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getMyVetProfile, updateMyVetProfile } from "@paw-match/api-client";
import type { UpdateVetProfilePayload } from "@paw-match/types";

export const createVetProfileSelfHooks = (client: AxiosInstance) => {
  const useMyVetProfile = () =>
    useQuery({
      queryKey: ["vetProfile", "me"],
      queryFn: () => getMyVetProfile(client),
    });

  const useUpdateMyVetProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: UpdateVetProfilePayload) => updateMyVetProfile(client, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vetProfile", "me"] }),
    });
  };

  return { useMyVetProfile, useUpdateMyVetProfile };
};
```

- [ ] **Step 2: Create `packages/hooks/src/vetAppointmentVet.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  getVetAppointments,
  scheduleVetAppointment,
  updateVetAppointmentStatus,
  type VetAppointmentsFilters,
} from "@paw-match/api-client";
import type { ScheduleVetAppointmentPayload, UpdateVetAppointmentStatusPayload } from "@paw-match/types";

/** Query/mutation hook factory for the vet-facing appointment workflow. */
export const createVetAppointmentVetHooks = (client: AxiosInstance) => {
  const vetAppointmentsKey = (filters: VetAppointmentsFilters) =>
    ["vetAppointments", "vet", filters] as const;

  const useVetAppointments = (filters: VetAppointmentsFilters = {}) =>
    useQuery({
      queryKey: vetAppointmentsKey(filters),
      queryFn: () => getVetAppointments(client, filters),
    });

  const invalidateVetAppointments = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["vetAppointments", "vet"] });

  const useScheduleVetAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: ScheduleVetAppointmentPayload }) =>
        scheduleVetAppointment(client, id, payload),
      onSuccess: () => invalidateVetAppointments(queryClient),
    });
  };

  const useUpdateVetAppointmentStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateVetAppointmentStatusPayload }) =>
        updateVetAppointmentStatus(client, id, payload),
      onSuccess: () => invalidateVetAppointments(queryClient),
    });
  };

  return { useVetAppointments, useScheduleVetAppointment, useUpdateVetAppointmentStatus };
};
```

- [ ] **Step 3: Export both**

Add to `frontend/packages/hooks/src/index.ts` (after `export * from "./shelterEmployeeShelter";`):
```ts
export * from "./vetProfileSelf";
export * from "./vetAppointmentVet";
```

- [ ] **Step 4: Wire into the Dashboard app**

Create `frontend/apps/dashboard/src/lib/vetProfileSelfHooks.ts`:
```ts
import { createVetProfileSelfHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const vetProfileSelfHooks = createVetProfileSelfHooks(apiClient);
```

Create `frontend/apps/dashboard/src/lib/vetAppointmentVetHooks.ts`:
```ts
import { createVetAppointmentVetHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const vetAppointmentVetHooks = createVetAppointmentVetHooks(apiClient);
```

Create `frontend/apps/dashboard/src/lib/userAccountHooks.ts` (wraps the existing
`createUserAccountHooks` factory, reused unchanged — this is the same factory
`apps/public-web/src/lib/userAccountHooks.ts` already wires up; the Dashboard app just hasn't needed
it until now):
```ts
import { createUserAccountHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const userAccountHooks = createUserAccountHooks(apiClient);
```

- [ ] **Step 5: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/hooks && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/packages/hooks/src/vetProfileSelf.ts frontend/packages/hooks/src/vetAppointmentVet.ts frontend/packages/hooks/src/index.ts frontend/apps/dashboard/src/lib/vetProfileSelfHooks.ts frontend/apps/dashboard/src/lib/vetAppointmentVetHooks.ts frontend/apps/dashboard/src/lib/userAccountHooks.ts
git commit -m "feat(hooks): add vet self-service profile and appointment hooks"
```

---

## Task 5: Vet Overview

**Files:**
- Create: `frontend/apps/dashboard/src/pages/vet/components/RecentAppointmentsFeed.tsx`
- Create: `frontend/apps/dashboard/src/pages/vet/VetOverview.tsx`
- Modify: `frontend/apps/dashboard/src/pages/OverviewPage.tsx`

- [ ] **Step 1: Create `RecentAppointmentsFeed.tsx`**

```tsx
import { CalendarDays } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, ListSkeleton } from "@paw-match/ui";
import type { VetAppointment } from "@paw-match/types";

export interface RecentAppointmentsFeedProps {
  appointments: VetAppointment[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const MAX_FEED_ITEMS = 8;

const statusLabel: Record<VetAppointment["status"], string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** Derived from the vet's own appointment list, sorted by most recently created — there is no dedicated activity/audit-log endpoint on the backend. */
export const RecentAppointmentsFeed = ({
  appointments,
  isLoading,
  isError,
  onRetry,
}: RecentAppointmentsFeedProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  if (isLoading) {
    return <ListSkeleton count={4} label="Loading recent appointments" />;
  }

  if (isError) {
    return <ErrorState title="Couldn't load recent appointments" onRetry={onRetry} />;
  }

  const items = [...(appointments ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_FEED_ITEMS);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No recent appointments yet"
        description="New appointment requests will show up here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((appointment, index) => (
        <motion.li
          key={appointment._id}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.05 }}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {appointment.adopterId
                ? `${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
                : "Appointment request"}
            </p>
            <p className="truncate text-xs text-slate-500">{statusLabel[appointment.status]}</p>
          </div>
          <span className="shrink-0 text-xs text-slate-400">
            {new Date(appointment.createdAt).toLocaleDateString()}
          </span>
        </motion.li>
      ))}
    </ul>
  );
};
```

- [ ] **Step 2: Create `VetOverview.tsx`**

```tsx
import { useMemo } from "react";
import { CalendarDays, CheckCircle2, Clock, UserRound } from "lucide-react";
import { ErrorState } from "@paw-match/ui";
import { StatCard } from "../../components/dashboard/StatCard";
import { QuickLinkCard } from "../../components/dashboard/QuickLinkCard";
import { RecentAppointmentsFeed } from "./components/RecentAppointmentsFeed";
import { vetAppointmentVetHooks } from "../../lib/vetAppointmentVetHooks";
import { paths } from "../../routes/paths";

const quickLinks = [
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
];

/** Statistics and recent appointments are both derived client-side from the vet's own appointment list — there is no dashboard-stats or activity-log endpoint on the backend. */
export const VetOverview = () => {
  const appointmentsQuery = vetAppointmentVetHooks.useVetAppointments();

  const stats = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    return {
      pending: appointments.filter((appointment) => appointment.status === "pending").length,
      scheduled: appointments.filter((appointment) => appointment.status === "scheduled").length,
      completed: appointments.filter((appointment) => appointment.status === "completed").length,
      total: appointments.length,
    };
  }, [appointmentsQuery.data]);

  const isLoading = appointmentsQuery.isLoading;
  const hasError = appointmentsQuery.isError;

  return (
    <div className="mt-8 flex flex-col gap-8">
      {hasError ? (
        <ErrorState title="Couldn't load appointment statistics" onRetry={() => appointmentsQuery.refetch()} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Needs scheduling" value={isLoading ? "…" : stats.pending} icon={Clock} index={0} />
          <StatCard
            label="Scheduled"
            value={isLoading ? "…" : stats.scheduled}
            icon={CalendarDays}
            tone="accent"
            index={1}
          />
          <StatCard label="Completed" value={isLoading ? "…" : stats.completed} icon={CheckCircle2} index={2} />
          <StatCard
            label="Total appointments"
            value={isLoading ? "…" : stats.total}
            icon={CalendarDays}
            tone="accent"
            index={3}
          />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recent appointments</h2>
        <div className="mt-4">
          <RecentAppointmentsFeed
            appointments={appointmentsQuery.data}
            isLoading={isLoading}
            isError={hasError}
            onRetry={() => appointmentsQuery.refetch()}
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

- [ ] **Step 3: Modify `OverviewPage.tsx`**

Replace the entire file content with:
```tsx
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { UserRole } from "@paw-match/types";
import { useAuth } from "../lib/auth";
import { SuperAdminOverview } from "./superadmin/SuperAdminOverview";
import { ShelterEmployeeOverview } from "./shelterEmployee/ShelterEmployeeOverview";
import { VetOverview } from "./vet/VetOverview";

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
      ) : role === "shelterEmployee" ? (
        <ShelterEmployeeOverview />
      ) : role === "vet" ? (
        <VetOverview />
      ) : null}
    </div>
  );
};

export default OverviewPage;
```

This removes the now-fully-dead generic `quickLinksByRole`/fallback-rendering path — every real
dashboard role (`superadmin`, `shelterEmployee`, `vet`) has its own explicit branch, and `adopter`
never reaches this app at all (blocked earlier by `App.tsx`'s `RequireRole` guard). The `CalendarDays`/
`Star`/`UserRound`/`QuickLinkCard` imports this file used only for the old generic vet quick-links
move to `VetOverview.tsx`, which now owns that content.

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/dashboard/src/pages/vet/components/RecentAppointmentsFeed.tsx frontend/apps/dashboard/src/pages/vet/VetOverview.tsx frontend/apps/dashboard/src/pages/OverviewPage.tsx
git commit -m "feat(dashboard): add Vet Overview stats, recent appointments, and quick actions"
```

---

## Task 6: My Profile

**Files:**
- Create: `frontend/apps/dashboard/src/pages/vet/MyProfilePage.tsx`

- [ ] **Step 1: Create `MyProfilePage.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  ErrorState,
  ImageUploader,
  Input,
  Spinner,
  Textarea,
  UserAvatar,
} from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import { getAverageRating } from "@paw-match/utilities";
import { vetProfileFormSchema } from "@paw-match/validation";
import type { VetProfileFormValues } from "@paw-match/validation";
import type { UpdateVetProfilePayload, VetProfile } from "@paw-match/types";
import { useAuth } from "../../lib/auth";
import { vetProfileSelfHooks } from "../../lib/vetProfileSelfHooks";
import { userAccountHooks } from "../../lib/userAccountHooks";

const weekDays: { label: string; value: VetProfileFormValues["availableDays"][number] }[] = [
  { label: "Sun", value: "sunday" },
  { label: "Mon", value: "monday" },
  { label: "Tue", value: "tuesday" },
  { label: "Wed", value: "wednesday" },
  { label: "Thu", value: "thursday" },
  { label: "Fri", value: "friday" },
  { label: "Sat", value: "saturday" },
];

const consultationTypeOptions: { label: string; value: VetProfileFormValues["consultationTypes"][number] }[] = [
  { label: "Vet consultation", value: "vetConsultation" },
  { label: "Behavior training", value: "behaviorTraining" },
];

const toFormValues = (profile: VetProfile): VetProfileFormValues => ({
  specialization: profile.specialization ?? "",
  bio: profile.bio ?? "",
  experienceYears: profile.experienceYears,
  availableDays: profile.availableDays,
  consultationTypes: profile.consultationTypes,
});

const toPayload = (values: VetProfileFormValues): UpdateVetProfilePayload => ({
  specialization: values.specialization || undefined,
  bio: values.bio || undefined,
  experienceYears: values.experienceYears,
  availableDays: values.availableDays,
  consultationTypes: values.consultationTypes,
});

/**
 * Identity display (name/photo) deliberately uses `auth.user`, never
 * `profile.userId` — the VetProfile type's `userId` populate is nullable in
 * practice (confirmed against real seed data) whereas `auth.user` is always
 * the reliably-present authenticated session's own data. Only vet-specific
 * fields (specialization/bio/etc., shelterId, reviews) come from the
 * VetProfile response.
 */
const MyProfilePage = () => {
  const auth = useAuth();
  const profileQuery = vetProfileSelfHooks.useMyVetProfile();
  const updateMutation = vetProfileSelfHooks.useUpdateMyVetProfile();

  const [stagedPhoto, setStagedPhoto] = useState<File[]>([]);
  const [isConfirmingPhotoDelete, setIsConfirmingPhotoDelete] = useState(false);
  const uploadPhotoMutation = userAccountHooks.useUploadProfileImage();
  const replacePhotoMutation = userAccountHooks.useReplaceProfileImage();
  const deletePhotoMutation = userAccountHooks.useDeleteProfileImage();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<VetProfileFormValues>({ resolver: zodResolver(vetProfileFormSchema) });

  useEffect(() => {
    if (profileQuery.data) reset(toFormValues(profileQuery.data));
  }, [profileQuery.data, reset]);

  const availableDays = watch("availableDays") ?? [];
  const consultationTypes = watch("consultationTypes") ?? [];

  const toggleDay = (day: VetProfileFormValues["availableDays"][number]) => {
    setValue(
      "availableDays",
      availableDays.includes(day) ? availableDays.filter((existing) => existing !== day) : [...availableDays, day],
      { shouldDirty: true },
    );
  };

  const toggleConsultationType = (type: VetProfileFormValues["consultationTypes"][number]) => {
    setValue(
      "consultationTypes",
      consultationTypes.includes(type)
        ? consultationTypes.filter((existing) => existing !== type)
        : [...consultationTypes, type],
      { shouldDirty: true },
    );
  };

  const onSubmit = (values: VetProfileFormValues) => {
    updateMutation.mutate(toPayload(values));
  };

  const hasExistingPhoto = Boolean(auth.user?.profileImage);
  const isPhotoMutating =
    uploadPhotoMutation.isPending || replacePhotoMutation.isPending || deletePhotoMutation.isPending;
  const photoError = uploadPhotoMutation.error ?? replacePhotoMutation.error ?? deletePhotoMutation.error;

  const handlePhotoSave = () => {
    const file = stagedPhoto[0];
    if (!file) return;
    const mutation = hasExistingPhoto ? replacePhotoMutation : uploadPhotoMutation;
    mutation.mutate(file, {
      onSuccess: (updatedUser) => {
        auth.updateUser(updatedUser);
        setStagedPhoto([]);
      },
    });
  };

  const handlePhotoDelete = () => {
    deletePhotoMutation.mutate(undefined, {
      onSuccess: (updatedUser) => {
        auth.updateUser(updatedUser);
        setIsConfirmingPhotoDelete(false);
      },
    });
  };

  if (profileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading your profile…" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => profileQuery.refetch()} />;
  }

  const profile = profileQuery.data;
  const averageRating = getAverageRating(profile.reviews);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My Profile</h1>
      <p className="mt-2 max-w-xl text-slate-600">Keep your specialization, bio, and availability current.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <form
            className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Specialization" error={errors.specialization?.message} {...register("specialization")} />
              <Input
                label="Experience (years)"
                type="number"
                min={0}
                max={80}
                error={errors.experienceYears?.message}
                {...register("experienceYears", { valueAsNumber: true })}
              />
            </div>

            <Textarea label="Bio" rows={4} error={errors.bio?.message} {...register("bio")} />

            <div>
              <p className="text-sm font-medium text-slate-700">Available days</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      availableDays.includes(day.value)
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">Consultation types</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {consultationTypeOptions.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleConsultationType(type.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      consultationTypes.includes(type.value)
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {updateMutation.isError && (
              <p role="alert" className="text-sm text-red-600">
                {getApiErrorMessage(updateMutation.error)}
              </p>
            )}
            {updateMutation.isSuccess && !isDirty && (
              <p role="status" className="text-sm text-accent-700">
                Profile updated.
              </p>
            )}

            <Button type="submit" className="self-start" isLoading={updateMutation.isPending} disabled={!isDirty}>
              Save changes
            </Button>
          </form>

          {profile.shelterId && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Affiliated shelter</h2>
              <p className="mt-2 text-sm text-slate-600">
                {profile.shelterId.name}, {profile.shelterId.city}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
              {averageRating !== undefined && (
                <Badge tone="brand">
                  {averageRating.toFixed(1)} / 5 ({profile.reviews.length})
                </Badge>
              )}
            </div>
            {profile.reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No reviews yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {profile.reviews.map((review) => (
                  <li key={review._id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-900">{review.rating} / 5</p>
                    {review.comment && <p className="mt-1 text-sm text-slate-600">{review.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Profile photo</h2>
          <div className="mt-4 flex items-center gap-4">
            <UserAvatar
              firstName={auth.user?.firstName}
              lastName={auth.user?.lastName}
              profileImage={auth.user?.profileImage}
              size="md"
            />
          </div>

          <div className="mt-4">
            <ImageUploader
              label="Choose photo"
              files={stagedPhoto}
              onFilesChange={setStagedPhoto}
              disabled={isPhotoMutating}
              hint="JPEG, PNG, GIF, or WebP. Max 5MB."
            />
          </div>

          {stagedPhoto.length > 0 && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" isLoading={isPhotoMutating} onClick={handlePhotoSave}>
                {hasExistingPhoto ? "Replace photo" : "Upload photo"}
              </Button>
              <Button size="sm" variant="secondary" disabled={isPhotoMutating} onClick={() => setStagedPhoto([])}>
                Cancel
              </Button>
            </div>
          )}

          {hasExistingPhoto && stagedPhoto.length === 0 && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              {!isConfirmingPhotoDelete ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPhotoMutating}
                  onClick={() => setIsConfirmingPhotoDelete(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete photo
                </Button>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
                    <p className="text-sm text-red-700">Delete your profile photo?</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPhotoMutating}
                      onClick={() => setIsConfirmingPhotoDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      isLoading={deletePhotoMutation.isPending}
                      onClick={handlePhotoDelete}
                    >
                      Confirm delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {photoError && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {getApiErrorMessage(photoError)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/apps/dashboard/src/pages/vet/MyProfilePage.tsx
git commit -m "feat(dashboard): add editable Vet My Profile page"
```

---

## Task 7: Appointments Management

**Files:**
- Create: `frontend/apps/dashboard/src/pages/vet/components/AppointmentsFilters.tsx`
- Create: `frontend/apps/dashboard/src/pages/vet/components/AppointmentQuickViewModal.tsx`
- Create: `frontend/apps/dashboard/src/pages/vet/components/ScheduleAppointmentDialog.tsx`
- Create: `frontend/apps/dashboard/src/pages/vet/components/CompleteAppointmentDialog.tsx`
- Create: `frontend/apps/dashboard/src/pages/vet/components/RejectAppointmentDialog.tsx`
- Create: `frontend/apps/dashboard/src/pages/vet/components/AppointmentsTable.tsx`
- Create: `frontend/apps/dashboard/src/pages/vet/AppointmentsPage.tsx`

- [ ] **Step 1: Create `AppointmentsFilters.tsx`**

```tsx
import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface AppointmentsFiltersValue {
  search: string;
  status: string;
}

export interface AppointmentsFiltersProps {
  value: AppointmentsFiltersValue;
  onChange: (value: AppointmentsFiltersValue) => void;
}

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

/** status maps to the real GET /vetappointments/vet query param; search (adopter name/email) is entirely client-side — the backend has no free-text search for this endpoint. */
export const AppointmentsFilters = ({ value, onChange }: AppointmentsFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <Input
      label="Search appointments"
      hideLabel
      placeholder="Search by adopter name or email"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
    />
    <Select
      label="Status"
      hideLabel
      placeholder="All statuses"
      options={statusOptions}
      value={value.status}
      onChange={(event) => onChange({ ...value, status: event.target.value })}
    />
  </div>
);
```

- [ ] **Step 2: Create `AppointmentQuickViewModal.tsx`**

```tsx
import { Badge, Modal } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { VetAppointment } from "@paw-match/types";

export interface AppointmentQuickViewModalProps {
  appointment: VetAppointment | null;
  onClose: () => void;
}

const statusTone: Record<VetAppointment["status"], BadgeTone> = {
  pending: "neutral",
  scheduled: "accent",
  completed: "brand",
  rejected: "danger",
  cancelled: "neutral",
};

const statusLabel: Record<VetAppointment["status"], string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** Read-only preview built entirely from data already present in the vet appointments list response — no additional API calls. */
export const AppointmentQuickViewModal = ({ appointment, onClose }: AppointmentQuickViewModalProps) => (
  <Modal
    isOpen={Boolean(appointment)}
    onClose={onClose}
    title={
      appointment?.adopterId
        ? `Appointment with ${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
        : "Appointment details"
    }
  >
    {appointment && (
      <div className="flex flex-col gap-4">
        <Badge tone={statusTone[appointment.status]}>{statusLabel[appointment.status]}</Badge>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          {appointment.adopterId?.email && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Adopter email</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{appointment.adopterId.email}</dd>
            </div>
          )}
          {appointment.adopterId?.phone && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Adopter phone</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{appointment.adopterId.phone}</dd>
            </div>
          )}
          {appointment.appointmentDate && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Date &amp; time</dt>
              <dd className="mt-0.5 font-medium text-slate-700">
                {new Date(appointment.appointmentDate).toLocaleString()}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Duration</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{appointment.duration} minutes</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Requested</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {new Date(appointment.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        {appointment.requestMessage && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Message from adopter</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{appointment.requestMessage}</p>
          </div>
        )}

        {appointment.vetNotes && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Your notes</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{appointment.vetNotes}</p>
          </div>
        )}

        {appointment.rejectionReason && (
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection reason</p>
            <p className="mt-1 text-sm text-red-800">{appointment.rejectionReason}</p>
          </div>
        )}
      </div>
    )}
  </Modal>
);
```

- [ ] **Step 3: Create `ScheduleAppointmentDialog.tsx`**

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal, Textarea } from "@paw-match/ui";
import { scheduleAppointmentSchema } from "@paw-match/validation";
import type { ScheduleAppointmentFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { VetAppointment } from "@paw-match/types";
import { vetAppointmentVetHooks } from "../../../lib/vetAppointmentVetHooks";

export interface ScheduleAppointmentDialogProps {
  appointment: VetAppointment | null;
  onClose: () => void;
}

/** Only valid when the appointment's current status is "pending". The backend rejects with 409 if the chosen time conflicts with another of the vet's own scheduled appointments — that error is surfaced verbatim, never re-validated client-side. */
export const ScheduleAppointmentDialog = ({ appointment, onClose }: ScheduleAppointmentDialogProps) => {
  const scheduleMutation = vetAppointmentVetHooks.useScheduleVetAppointment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleAppointmentFormValues>({
    resolver: zodResolver(scheduleAppointmentSchema),
    defaultValues: { appointmentDate: "", duration: 30, vetNotes: "" },
  });

  useEffect(() => {
    if (appointment) reset({ appointmentDate: "", duration: 30, vetNotes: "" });
  }, [appointment, reset]);

  const onSubmit = (values: ScheduleAppointmentFormValues) => {
    if (!appointment) return;
    scheduleMutation.mutate(
      {
        id: appointment._id,
        payload: {
          appointmentDate: new Date(values.appointmentDate).toISOString(),
          duration: values.duration,
          vetNotes: values.vetNotes || undefined,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      isOpen={Boolean(appointment)}
      onClose={onClose}
      title={
        appointment?.adopterId
          ? `Schedule appointment with ${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
          : "Schedule appointment"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={scheduleMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={scheduleMutation.isPending}>
            Schedule
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Date & time"
          type="datetime-local"
          error={errors.appointmentDate?.message}
          {...register("appointmentDate")}
        />
        <Input
          label="Duration (minutes)"
          type="number"
          min={15}
          max={180}
          step={15}
          error={errors.duration?.message}
          {...register("duration", { valueAsNumber: true })}
        />
        <Textarea label="Notes (optional)" rows={3} error={errors.vetNotes?.message} {...register("vetNotes")} />
        {scheduleMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(scheduleMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
```

- [ ] **Step 4: Create `CompleteAppointmentDialog.tsx`**

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { completeAppointmentSchema } from "@paw-match/validation";
import type { CompleteAppointmentFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { VetAppointment } from "@paw-match/types";
import { vetAppointmentVetHooks } from "../../../lib/vetAppointmentVetHooks";

export interface CompleteAppointmentDialogProps {
  appointment: VetAppointment | null;
  onClose: () => void;
}

/** Only valid when the appointment's current status is "scheduled". */
export const CompleteAppointmentDialog = ({ appointment, onClose }: CompleteAppointmentDialogProps) => {
  const statusMutation = vetAppointmentVetHooks.useUpdateVetAppointmentStatus();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompleteAppointmentFormValues>({
    resolver: zodResolver(completeAppointmentSchema),
    defaultValues: { vetNotes: "" },
  });

  useEffect(() => {
    if (appointment) reset({ vetNotes: "" });
  }, [appointment, reset]);

  const onSubmit = (values: CompleteAppointmentFormValues) => {
    if (!appointment) return;
    statusMutation.mutate(
      { id: appointment._id, payload: { status: "completed", vetNotes: values.vetNotes || undefined } },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      isOpen={Boolean(appointment)}
      onClose={onClose}
      title={
        appointment?.adopterId
          ? `Complete appointment with ${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
          : "Complete appointment"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={statusMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={statusMutation.isPending}>
            Mark completed
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Textarea label="Notes (optional)" rows={3} error={errors.vetNotes?.message} {...register("vetNotes")} />
        {statusMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(statusMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
```

- [ ] **Step 5: Create `RejectAppointmentDialog.tsx`**

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { rejectAppointmentSchema } from "@paw-match/validation";
import type { RejectAppointmentFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { VetAppointment } from "@paw-match/types";
import { vetAppointmentVetHooks } from "../../../lib/vetAppointmentVetHooks";

export interface RejectAppointmentDialogProps {
  appointment: VetAppointment | null;
  onClose: () => void;
}

/** Only valid when the appointment's current status is "scheduled". A reason is required. */
export const RejectAppointmentDialog = ({ appointment, onClose }: RejectAppointmentDialogProps) => {
  const statusMutation = vetAppointmentVetHooks.useUpdateVetAppointmentStatus();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectAppointmentFormValues>({ resolver: zodResolver(rejectAppointmentSchema) });

  useEffect(() => {
    if (appointment) reset({ rejectionReason: "" });
  }, [appointment, reset]);

  const onSubmit = (values: RejectAppointmentFormValues) => {
    if (!appointment) return;
    statusMutation.mutate(
      { id: appointment._id, payload: { status: "rejected", rejectionReason: values.rejectionReason } },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      isOpen={Boolean(appointment)}
      onClose={onClose}
      title={
        appointment?.adopterId
          ? `Reject appointment with ${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
          : "Reject appointment"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={statusMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={statusMutation.isPending}>
            Reject appointment
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-slate-600">A reason is required and will be shown to the adopter.</p>
        <Textarea
          label="Rejection reason"
          rows={4}
          error={errors.rejectionReason?.message}
          {...register("rejectionReason")}
        />
        {statusMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(statusMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
```

- [ ] **Step 6: Create `AppointmentsTable.tsx`**

```tsx
import { useState } from "react";
import { CalendarPlus, CheckCircle2, Eye, XCircle } from "lucide-react";
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
import type { VetAppointment } from "@paw-match/types";
import { AppointmentQuickViewModal } from "./AppointmentQuickViewModal";
import { ScheduleAppointmentDialog } from "./ScheduleAppointmentDialog";
import { CompleteAppointmentDialog } from "./CompleteAppointmentDialog";
import { RejectAppointmentDialog } from "./RejectAppointmentDialog";

const statusTone: Record<VetAppointment["status"], BadgeTone> = {
  pending: "neutral",
  scheduled: "accent",
  completed: "brand",
  rejected: "danger",
  cancelled: "neutral",
};

const statusLabel: Record<VetAppointment["status"], string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export interface AppointmentsTableProps {
  appointments: VetAppointment[];
}

/** Only shows the exact next actions valid for each appointment's current status, per the backend's confirmed transition rules: pending -> schedule; scheduled -> complete or reject. */
export const AppointmentsTable = ({ appointments }: AppointmentsTableProps) => {
  const [viewTarget, setViewTarget] = useState<VetAppointment | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<VetAppointment | null>(null);
  const [completeTarget, setCompleteTarget] = useState<VetAppointment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<VetAppointment | null>(null);

  return (
    <>
      <Table>
        <TableHead>
          <TableHeaderCell>Adopter</TableHeaderCell>
          <TableHeaderCell>Date &amp; time</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Requested</TableHeaderCell>
          <TableHeaderCell>
            <VisuallyHidden>Actions</VisuallyHidden>
          </TableHeaderCell>
        </TableHead>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    firstName={appointment.adopterId?.firstName}
                    lastName={appointment.adopterId?.lastName}
                    profileImage={appointment.adopterId?.profileImage}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {appointment.adopterId
                        ? `${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
                        : "Unknown adopter"}
                    </p>
                    {appointment.adopterId?.email && (
                      <p className="truncate text-xs text-slate-500">{appointment.adopterId.email}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {appointment.appointmentDate
                  ? new Date(appointment.appointmentDate).toLocaleString()
                  : "Not yet scheduled"}
              </TableCell>
              <TableCell>
                <Badge tone={statusTone[appointment.status]}>{statusLabel[appointment.status]}</Badge>
              </TableCell>
              <TableCell>{new Date(appointment.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1.5">
                  {appointment.status === "pending" && (
                    <Button variant="secondary" size="sm" onClick={() => setScheduleTarget(appointment)}>
                      <CalendarPlus className="h-4 w-4" aria-hidden />
                      Schedule
                    </Button>
                  )}

                  {appointment.status === "scheduled" && (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => setCompleteTarget(appointment)}>
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Complete
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setRejectTarget(appointment)}>
                        <XCircle className="h-4 w-4" aria-hidden />
                        Reject
                      </Button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setViewTarget(appointment)}
                    aria-label="View appointment"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AppointmentQuickViewModal appointment={viewTarget} onClose={() => setViewTarget(null)} />
      <ScheduleAppointmentDialog appointment={scheduleTarget} onClose={() => setScheduleTarget(null)} />
      <CompleteAppointmentDialog appointment={completeTarget} onClose={() => setCompleteTarget(null)} />
      <RejectAppointmentDialog appointment={rejectTarget} onClose={() => setRejectTarget(null)} />
    </>
  );
};
```

- [ ] **Step 7: Create `AppointmentsPage.tsx`**

```tsx
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, Pagination, TableSkeleton } from "@paw-match/ui";
import type { VetAppointmentStatus } from "@paw-match/types";
import { vetAppointmentVetHooks } from "../../lib/vetAppointmentVetHooks";
import { AppointmentsFilters } from "./components/AppointmentsFilters";
import type { AppointmentsFiltersValue } from "./components/AppointmentsFilters";
import { AppointmentsTable } from "./components/AppointmentsTable";

const PAGE_SIZE = 10;
const APPOINTMENTS_TABLE_COLUMN_COUNT = 5;

const emptyFilters: AppointmentsFiltersValue = { search: "", status: "" };

const AppointmentsPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const [filters, setFilters] = useState<AppointmentsFiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);

  const appointmentsQuery = vetAppointmentVetHooks.useVetAppointments(
    filters.status ? { status: filters.status as VetAppointmentStatus } : {},
  );

  const filteredAppointments = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    if (search.length === 0) return appointments;

    return appointments.filter((appointment) => {
      if (!appointment.adopterId) return false;
      const adopterName = `${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`.toLowerCase();
      return adopterName.includes(search) || appointment.adopterId.email.toLowerCase().includes(search);
    });
  }, [appointmentsQuery.data, filters.search]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredAppointments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: AppointmentsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Appointments</h1>
      <p className="mt-2 max-w-xl text-slate-600">Schedule requests and manage upcoming consultations.</p>

      <div className="mt-6">
        <AppointmentsFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {appointmentsQuery.isLoading && <TableSkeleton columns={APPOINTMENTS_TABLE_COLUMN_COUNT} rows={PAGE_SIZE} />}

        {appointmentsQuery.isError && (
          <ErrorState title="Couldn't load appointments" onRetry={() => appointmentsQuery.refetch()} />
        )}

        {appointmentsQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No appointments match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {appointmentsQuery.isSuccess && pageItems.length > 0 && (
          <>
            <AppointmentsTable appointments={pageItems} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AppointmentsPage;
```

- [ ] **Step 8: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add frontend/apps/dashboard/src/pages/vet/components/AppointmentsFilters.tsx frontend/apps/dashboard/src/pages/vet/components/AppointmentQuickViewModal.tsx frontend/apps/dashboard/src/pages/vet/components/ScheduleAppointmentDialog.tsx frontend/apps/dashboard/src/pages/vet/components/CompleteAppointmentDialog.tsx frontend/apps/dashboard/src/pages/vet/components/RejectAppointmentDialog.tsx frontend/apps/dashboard/src/pages/vet/components/AppointmentsTable.tsx frontend/apps/dashboard/src/pages/vet/AppointmentsPage.tsx
git commit -m "feat(dashboard): add Vet Appointments Management page"
```

---

## Task 8: Wire the new pages into routing

**Files:**
- Modify: `frontend/apps/dashboard/src/App.tsx`

- [ ] **Step 1: Add lazy imports**

In `frontend/apps/dashboard/src/App.tsx`, add these two lines alongside the other `lazy(() =>
import(...))` declarations (after the `AdoptionRequestsPage` lazy import line):
```tsx
const MyProfilePage = lazy(() => import("./pages/vet/MyProfilePage"));
const AppointmentsPage = lazy(() => import("./pages/vet/AppointmentsPage"));
```

- [ ] **Step 2: Replace the `ComingSoonPage` routes for `vet-profile`/`appointments`**

Find this block (inside the `vet`-gated `<Route>`):
```tsx
            <Route element={<RequireRole roles={["vet"]} redirectTo={paths.home} />}>
              <Route
                path="vet-profile"
                element={<ComingSoonPage title="My Profile" description="Keep your specialization, bio, and availability current." />}
              />
              <Route
                path="appointments"
                element={<ComingSoonPage title="Appointments" description="Schedule requests and manage upcoming consultations." />}
              />
            </Route>
```
Replace it with:
```tsx
            <Route element={<RequireRole roles={["vet"]} redirectTo={paths.home} />}>
              <Route path="vet-profile" element={<MyProfilePage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
            </Route>
```

Do not touch the `reviews`, `notifications`, or `account` `ComingSoonPage` routes, or anything under
the `superadmin`-gated or `shelterEmployee`-gated blocks — all stay exactly as they are.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/dashboard/src/App.tsx
git commit -m "feat(dashboard): route My Profile and Appointments to the new Vet pages"
```

---

## Task 9: Full workspace verification

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
Expected: build succeeds, no errors — confirms nothing in `packages/*` broke the other app (in
particular, the `VetProfile`/`VetAppointment` type additions must not affect any existing
adopter-facing usage of those same types).

- [ ] **Step 4: Lint**

Run: `cd frontend && npm run lint`
Expected: no-op (no lint is configured anywhere in this repo, confirmed in Phase 3 — this step just
reconfirms nothing changed that assumption).

- [ ] **Step 5: Manual dev-server verification**

Run: `cd frontend/apps/dashboard && npx vite --port <a free port>` (in the background), then, while
it's running, using an existing seeded `vet`-role account if available (read-only — no new accounts,
no seeding, per the standing DB-read-only-during-testing policy):
- Confirm `/` shows Welcome header, 4 appointment stat cards, a Recent Appointments section, and 2
  Quick Action cards.
- Confirm `/vet-profile` shows the editable form (specialization, bio, experience years, available
  days, consultation types), that Save only enables when the form is dirty, that the photo
  upload/replace/delete flow works end-to-end, that the affiliated-shelter blurb only appears when
  `shelterId` is set, and that the reviews summary shows a client-computed average (never a raw
  `averageRating` field).
- Confirm `/appointments` shows the table with search/status filters, that only the
  backend-valid next action appears per appointment status (Schedule for pending; Complete/Reject for
  scheduled; neither for completed/rejected/cancelled), and that Reject requires a reason and surfaces
  the backend's error message on failure (e.g. a scheduling conflict).
- Confirm signing in as `superadmin` or `shelterEmployee` still behaves exactly as before (unaffected
  by this phase), and that visiting `/vet-profile` or `/appointments` as either role redirects to
  `/unauthorized`.
- Confirm `/reviews`, `/notifications`, and `/account` still show `ComingSoonPage` for every role —
  nothing belonging to a later phase was touched.
- Stop the dev server afterward.

- [ ] **Step 6: Responsive check**

With the dev server running, check My Profile's form and Appointments' table at 375px, 768px,
1024px, and 1440px: confirm no horizontal page overflow, form fields stack to one column below `sm`,
the appointments table scrolls inside its own container rather than the page, and the day/
consultation-type toggle-pill rows wrap sensibly on narrow widths.

- [ ] **Step 7: Verify query invalidation**

Confirm (via the React Query devtools or by observing the UI update without a manual refresh) that:
saving My Profile refreshes the displayed profile; uploading/replacing/deleting the profile photo
updates the avatar everywhere it's shown (TopBar included, since `auth.updateUser` is called on
every photo mutation success); scheduling/completing/rejecting an appointment refreshes both the
Appointments list and the Overview's appointment stats.

- [ ] **Step 8: Report results**

Summarize: typecheck result, all three build results, lint result, and what was manually verified vs.
anything that couldn't be verified (e.g. no known vet test-account credentials would limit how much
of the live workflow could be exercised without creating data, which the
DB-read-only-during-testing policy prohibits).

---

## Self-review notes (completed during planning, not a task to execute)

- **Spec coverage:** Vet Overview (stats/recent appointments/quick actions) → Task 5. My Profile
  (fully editable + photo + shelter blurb + reviews summary) → Task 6. Appointments Management
  (filters/table/quick-view/schedule/complete/reject) → Task 7. Shared data layer (types/validation/
  api-client/hooks) → Tasks 1-4. Routing → Task 8. Both confirmed facts (no Manager-gate-style bug
  for vet; `averageRating`/`totalReviews` never persisted) are reflected directly in the code
  (My Profile computes its own average; no permission-tier UI exists anywhere).
- **No placeholders:** every step shows complete file content or an exact diff; no "add error
  handling"/"TBD" phrasing appears.
- **Type consistency:** `UpdateVetProfilePayload` (Task 1) is the single payload shape used
  identically by `updateMyVetProfile` (Task 3), `useUpdateMyVetProfile` (Task 4), and
  `MyProfilePage`'s `toPayload` (Task 6). `ScheduleVetAppointmentPayload`/
  `UpdateVetAppointmentStatusPayload` (Task 1) are used identically across the api-client (Task 3),
  hooks (Task 4), and all three appointment-action dialogs (Task 7). Mutation variable shapes
  (`{id, payload}`) match exactly between hook definitions (Task 4) and every call site (Task 7).
  `VetAppointment`'s nullable `adopterId`/`vetId` are handled defensively everywhere they're
  rendered (`RecentAppointmentsFeed`, `AppointmentQuickViewModal`, `AppointmentsTable`,
  `AppointmentsPage`'s search filter) — never assumed present.
- **No new shared components or class-cascade risk this phase** — every UI element reuses an
  existing `packages/ui` primitive exactly as-is (including the `Modal` `size` prop and
  `ImageUploader` added in Phase 3), so there was nothing new to check for the two classes of bugs
  caught in Phases 2-3's self-reviews.
