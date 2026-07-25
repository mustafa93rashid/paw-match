# Shelter Employee Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Shelter Employee's Overview, My Shelter (read-only), Animals Management, Adoption
Requests Management, and a read-only Shelter Employees team list, per the approved design
(`docs/superpowers/specs/2026-07-24-shelter-employee-dashboard-design.md`), using only existing,
confirmed backend endpoints.

**Architecture:** A new data layer (types → validation → api-client → hooks) mirrors the exact
separate-file convention established in Phase 2 (e.g. `shelterAdmin.ts` kept apart from the
adopter-facing `shelters.ts`) — new files for shelter-employee-facing animal/adoption-request/
shelter/profile operations, never modifying the existing adopter-facing files. One new generic
shared component (`ImageUploader`) lands in `packages/ui`. Everything else is Dashboard-specific
under `apps/dashboard/src/pages/shelterEmployee/`.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Framer Motion, TanStack Query v5, React Hook
Form + Zod, React Router v7 — all already in place; no new dependencies.

**Verification approach:** No test framework exists in this repo (confirmed in Phase 2's plan and
still true). Each task ends with a typecheck checkpoint instead of a test run, following the same
convention as the Phase 2 plan; a full manual verification pass closes the plan.

**Two backend limitations shape this plan's scope (both already decided with you):**
1. The Manager-permission gate (`checkShelterEmployeePermission`) is broken (case-sensitivity bug —
   queries `"Manager"`, stored values are lowercase `"manager"`) and always returns `false`. Shelter
   profile editing, logo/gallery management, and employee add/remove are **excluded from this
   plan** — paused until the backend bug is fixed elsewhere.
2. Neither `GET /animals` nor `GET /animals/:id` can ever return a soft-deleted animal for a
   shelterEmployee (`isActive` forced `true` server-side) — **Restore is implemented only as an
   immediate, session-scoped "Undo" right after a successful Delete**, never a persistent list.

---

## Backend endpoints used (all pre-existing, none modified)

| Endpoint | Method | Used for |
|---|---|---|
| `/shelter-employee-profile/me` | GET | Resolve own shelter id; Overview, My Shelter |
| `/shelters/:id` | GET | My Shelter detail, Shelter Employees team list (same fetch, reused) |
| `/animals` | GET | Animals Management list (server-side `shelterId`/`search`/`species`/`gender`/`size`/`healthStatus`/`adoptionStatus`/`vaccinated`; client-side sort + pagination) |
| `/animals` | POST | Create animal |
| `/animals/:id` | PATCH | Update animal |
| `/animals/:id` | DELETE | Soft delete (+ session-only undo) |
| `/animals/:id/restore` | PATCH | Undo affordance only |
| `/animals/:id/images` | POST | Add images (multipart field `images`, max 8 total) |
| `/animals/:id/images/:imageId` | PATCH | Replace one image (multipart field `image`) |
| `/animals/:id/images/:imageId/primary` | PATCH | Set primary image |
| `/animals/:id/images/:imageId` | DELETE | Delete one image |
| `/animals/:id/images` | DELETE | Delete all images |
| `/adoptions/shelter` | GET | Adoption Requests list (server-side `animalId`/`adopterId`/`status`; client-side search + pagination) |
| `/adoptions/:id/status` | PATCH | Move to interview/homeCheck (`{status}`) |
| `/adoptions/:id/approve` | PATCH | Approve (only from `homeCheck`) |
| `/adoptions/:id/reject` | PATCH | Reject (`{rejectionReason}`, only from `pendingReview`\|`interview`\|`homeCheck`) |
| `/adoptions/:id/complete` | PATCH | Complete (only from `approved`) |
| `/adoptions/:id/cancel-approval` | PATCH | Cancel an approved request (`{reason}`, only from `approved`, ends as `rejected`) |

No endpoint is invented. No backend file is modified.

---

## File inventory

**New — data layer (types):**
- `frontend/packages/types/src/animal.ts` (modified — add `AnimalPayload`)
- `frontend/packages/types/src/adoptionRequest.ts` (modified — add `AdoptionRequestAdopterRef`, `ShelterAdoptionRequest`)
- `frontend/packages/types/src/shelter.ts` (modified — add `ShelterTeamMemberRef`, `ShelterEmployeeShelterDetail`)
- `frontend/packages/types/src/shelterEmployeeProfile.ts` (new)
- `frontend/packages/types/src/index.ts` (modified)

**New — data layer (validation):**
- `frontend/packages/validation/src/animal.ts` (new)
- `frontend/packages/validation/src/adoptionRequestShelter.ts` (new)
- `frontend/packages/validation/src/index.ts` (modified)

**New — data layer (api-client):**
- `frontend/packages/api-client/src/animalManagement.ts` (new)
- `frontend/packages/api-client/src/adoptionRequestShelter.ts` (new)
- `frontend/packages/api-client/src/shelterEmployeeProfile.ts` (new)
- `frontend/packages/api-client/src/shelterEmployeeShelter.ts` (new)
- `frontend/packages/api-client/src/index.ts` (modified)

**New — data layer (hooks):**
- `frontend/packages/hooks/src/animalManagement.ts` (new)
- `frontend/packages/hooks/src/adoptionRequestShelter.ts` (new)
- `frontend/packages/hooks/src/shelterEmployeeProfile.ts` (new)
- `frontend/packages/hooks/src/shelterEmployeeShelter.ts` (new)
- `frontend/packages/hooks/src/index.ts` (modified)

**New — Dashboard lib wiring:**
- `frontend/apps/dashboard/src/lib/animalHooks.ts` (new — wraps the existing read-only `createAnimalHooks`)
- `frontend/apps/dashboard/src/lib/animalManagementHooks.ts` (new)
- `frontend/apps/dashboard/src/lib/adoptionRequestShelterHooks.ts` (new)
- `frontend/apps/dashboard/src/lib/shelterEmployeeProfileHooks.ts` (new)
- `frontend/apps/dashboard/src/lib/shelterEmployeeShelterHooks.ts` (new)

**New — shared UI (`packages/ui`):**
- `frontend/packages/ui/src/ImageUploader.tsx` (new)
- `frontend/packages/ui/src/index.ts` (modified)

**Modified — routing/paths:**
- `frontend/apps/dashboard/src/routes/paths.ts` (modified — add `shelterEmployees: "/shelter/employees"`)
- `frontend/apps/dashboard/src/App.tsx` (modified — nested `shelter` route, `animals`, `adoption-requests`)

**New — Overview:**
- `frontend/apps/dashboard/src/pages/shelterEmployee/ShelterEmployeeOverview.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/RecentRecordsFeed.tsx` (new)
- `frontend/apps/dashboard/src/pages/OverviewPage.tsx` (modified — third role branch)

**New — My Shelter / Team:**
- `frontend/apps/dashboard/src/pages/shelterEmployee/MyShelterPage.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/ShelterEmployeesPage.tsx` (new)

**New — Animals Management:**
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalsFilters.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalCard.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalCardSkeleton.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalFormModal.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalImagesModal.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalQuickViewModal.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/DeleteAnimalDialog.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/AnimalsPage.tsx` (new)

**New — Adoption Requests Management:**
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/AdoptionRequestsFilters.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/AdoptionRequestsTable.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/AdoptionRequestQuickViewModal.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/RejectAdoptionRequestDialog.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/components/CancelApprovalDialog.tsx` (new)
- `frontend/apps/dashboard/src/pages/shelterEmployee/AdoptionRequestsPage.tsx` (new)

No file outside `frontend/` is touched. No backend file is touched.

---

## Task 1: Types

**Files:**
- Modify: `frontend/packages/types/src/animal.ts`
- Modify: `frontend/packages/types/src/adoptionRequest.ts`
- Modify: `frontend/packages/types/src/shelter.ts`
- Create: `frontend/packages/types/src/shelterEmployeeProfile.ts`
- Modify: `frontend/packages/types/src/index.ts`

- [ ] **Step 1: Add `AnimalPayload` to `animal.ts`**

Append to the end of `frontend/packages/types/src/animal.ts`:
```ts

/**
 * POST /animals and PATCH /animals/:id share this exact field set (the
 * update endpoint rejects shelterId/isActive/adoptionStatus/images the same
 * way create does) — the edit form always sends the full set, never a
 * partial diff, so one payload type covers both.
 */
export interface AnimalPayload {
  name: string;
  age: number;
  ageUnit: AgeUnit;
  species: Species;
  breed: string;
  gender: Gender;
  size: AnimalSize;
  color: string;
  healthStatus: HealthStatus;
  vaccinated: boolean;
  description?: string;
  requirements: AnimalRequirements;
}
```

- [ ] **Step 2: Add `AdoptionRequestAdopterRef`/`ShelterAdoptionRequest` to `adoptionRequest.ts`**

Append to the end of `frontend/packages/types/src/adoptionRequest.ts`:
```ts

/**
 * Populated adopterId as returned by GET /adoptions/shelter and
 * GET /adoptions/:id for a shelterEmployee/superadmin caller — the
 * adopter-facing AdoptionRequest type above intentionally omits this (see
 * its header comment); the shelter-facing view needs to show who's asking.
 */
export interface AdoptionRequestAdopterRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  profileImage?: ImageRef | null;
}

/** Shape returned by GET /adoptions/shelter and GET /adoptions/:id for shelterEmployee/superadmin — adds the populated adopterId. */
export interface ShelterAdoptionRequest extends AdoptionRequest {
  adopterId: AdoptionRequestAdopterRef;
}
```

- [ ] **Step 3: Add `ShelterTeamMemberRef`/`ShelterEmployeeShelterDetail` to `shelter.ts`**

Append to the end of `frontend/packages/types/src/shelter.ts` (after the `AdminShelter` interface added
in Phase 2):
```ts

/**
 * One entry of the `employees` array as populated by GET /shelters/:id for
 * a shelterEmployee caller (`.populate("employees", "firstName lastName
 * email phone role profileImage isActive")`). Nullable per-entry: if a
 * referenced User was deleted, populate resolves that slot to null — the
 * exact same class of bug confirmed for AdminShelter.createdBy in Phase 2.
 */
export interface ShelterTeamMemberRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: ImageRef | null;
  isActive: boolean;
}

/**
 * Shape returned by GET /shelters/:id for the "shelterEmployee" accessLevel
 * branch — same admin-style fields as AdminShelter, plus the populated
 * `employees` array (used by both My Shelter and the Shelter Employees team
 * list, which share this one fetch).
 */
export interface ShelterEmployeeShelterDetail extends AdminShelter {
  employees: (ShelterTeamMemberRef | null)[];
}
```

- [ ] **Step 4: Create `shelterEmployeeProfile.ts`**

```ts
/**
 * Mirrors src/models/ShelterEmployeeProfile.js and the response of
 * GET /shelter-employee-profile/me (src/controllers/shelterEmployeeProfile.controller.js).
 */
import type { ImageRef } from "./shelter";
import type { MongoId, UserRole } from "./common";

export type ShelterEmployeePosition = "manager" | "employee";

export interface ShelterEmployeeProfileUserRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  address?: string;
  profileImage?: ImageRef | null;
  role: UserRole;
  isActive: boolean;
}

export interface ShelterEmployeeProfileShelterRef {
  _id: MongoId;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

/** Shape returned by GET /shelter-employee-profile/me. `shelterId` is null until an employee is assigned to (or after being removed from) a shelter. */
export interface ShelterEmployeeProfile {
  _id: MongoId;
  userId: ShelterEmployeeProfileUserRef;
  shelterId: ShelterEmployeeProfileShelterRef | null;
  position: ShelterEmployeePosition;
  employeeNumber: string | null;
  hireDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 5: Export the new file**

Add to `frontend/packages/types/src/index.ts` (after `export * from "./notification";`):
```ts
export * from "./shelterEmployeeProfile";
```

- [ ] **Step 6: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/types`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/packages/types/src/animal.ts frontend/packages/types/src/adoptionRequest.ts frontend/packages/types/src/shelter.ts frontend/packages/types/src/shelterEmployeeProfile.ts frontend/packages/types/src/index.ts
git commit -m "feat(types): add shelter-employee-facing animal/adoption-request/shelter/profile types"
```

---

## Task 2: Validation schemas

**Files:**
- Create: `frontend/packages/validation/src/animal.ts`
- Create: `frontend/packages/validation/src/adoptionRequestShelter.ts`
- Modify: `frontend/packages/validation/src/index.ts`

- [ ] **Step 1: Create the animal form schema**

```ts
/**
 * Zod schema mirroring src/validation/animal.validate.js's create/update
 * animal validators (both share the same field set for this form). Boolean-
 * like fields use "true"/"false" string enums bound to <select> elements,
 * converted to real booleans at submit time — same convention as
 * adopterProfile.ts.
 */
import { z } from "zod";

export const animalFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be between 2 and 50 characters")
    .max(50, "Name must be between 2 and 50 characters"),
  age: z.number({ message: "Age is required" }).min(0, "Age cannot be negative"),
  ageUnit: z.enum(["months", "years"], { message: "Please select an age unit" }),
  species: z.enum(["dog", "cat", "bird", "rabbit", "fish", "other"], {
    message: "Please select a species",
  }),
  breed: z.string().trim().min(1, "Breed is required").max(100, "Breed cannot exceed 100 characters"),
  gender: z.enum(["male", "female"], { message: "Please select a gender" }),
  size: z.enum(["small", "medium", "large"], { message: "Please select a size" }),
  color: z.string().trim().min(1, "Color is required").max(100, "Color cannot exceed 100 characters"),
  healthStatus: z.enum(["healthy", "needsCare", "specialNeeds", "underTreatment"], {
    message: "Please select a health status",
  }),
  vaccinated: z.enum(["true", "false"], { message: "Please select an option" }),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  homeType: z.enum(["apartment", "house", "farm", "any"], { message: "Please select a home type" }),
  suitableForKids: z.enum(["true", "false"], { message: "Please select an option" }),
  goodWithOtherPets: z.enum(["true", "false"], { message: "Please select an option" }),
  experienceLevel: z.enum(["beginner", "intermediate", "expert", "any"], {
    message: "Please select an experience level",
  }),
  dailyActivityLevel: z.enum(["low", "medium", "high"], { message: "Please select an activity level" }),
  ownerType: z.enum(["single", "family", "any"], { message: "Please select an owner type" }),
  hypoallergenic: z.enum(["true", "false"], { message: "Please select an option" }),
});

export type AnimalFormValues = z.infer<typeof animalFormSchema>;
```

- [ ] **Step 2: Create the adoption-request reason schemas**

```ts
/**
 * Zod schemas mirroring src/validation/adoptionRequest.validate.js's
 * rejectRequestValidation and cancelApprovedRequestValidation (both require
 * a 3-1000 character reason).
 */
import { z } from "zod";

export const rejectAdoptionRequestSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(3, "Rejection reason must be between 3 and 1000 characters")
    .max(1000, "Rejection reason must be between 3 and 1000 characters"),
});

export type RejectAdoptionRequestFormValues = z.infer<typeof rejectAdoptionRequestSchema>;

export const cancelApprovedRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Cancellation reason must be between 3 and 1000 characters")
    .max(1000, "Cancellation reason must be between 3 and 1000 characters"),
});

export type CancelApprovedRequestFormValues = z.infer<typeof cancelApprovedRequestSchema>;
```

- [ ] **Step 3: Export both**

Add to `frontend/packages/validation/src/index.ts` (after `export * from "./shelterAdmin";`):
```ts
export * from "./animal";
export * from "./adoptionRequestShelter";
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/validation`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/packages/validation/src/animal.ts frontend/packages/validation/src/adoptionRequestShelter.ts frontend/packages/validation/src/index.ts
git commit -m "feat(validation): add animal form and adoption-request reason schemas"
```

---

## Task 3: api-client functions

**Files:**
- Create: `frontend/packages/api-client/src/animalManagement.ts`
- Create: `frontend/packages/api-client/src/adoptionRequestShelter.ts`
- Create: `frontend/packages/api-client/src/shelterEmployeeProfile.ts`
- Create: `frontend/packages/api-client/src/shelterEmployeeShelter.ts`
- Modify: `frontend/packages/api-client/src/index.ts`

- [ ] **Step 1: Create `animalManagement.ts`**

```ts
/**
 * Shelter-employee/superadmin endpoint functions for
 * src/routes/animal.route.js's write actions. Kept separate from
 * ./animals.ts, which is documented there as the read-only getAll/getOne
 * subset only.
 */
import type { AxiosInstance } from "axios";
import type { Animal, AnimalPayload } from "@paw-match/types";

/** POST /animals — shelterId is derived server-side from the caller's own ShelterEmployeeProfile; images/isActive/adoptionStatus/addedBy are rejected if present. New animals are forced adoptionStatus:"unavailable" until an image is added. */
export const createAnimal = async (client: AxiosInstance, payload: AnimalPayload): Promise<Animal> => {
  const { data } = await client.post<{ success: true; message: string; data: Animal }>(
    "/animals",
    payload,
  );
  return data.data;
};

/** PATCH /animals/:id — same field set as create; shelterId/isActive/adoptionStatus/images are rejected if present (400). */
export const updateAnimal = async (
  client: AxiosInstance,
  id: string,
  payload: AnimalPayload,
): Promise<Animal> => {
  const { data } = await client.patch<{ success: true; message: string; data: Animal }>(
    `/animals/${id}`,
    payload,
  );
  return data.data;
};

/** DELETE /animals/:id — soft delete only (sets isActive:false). 400 if already inactive or if adoptionStatus is "adopted". */
export const deleteAnimal = async (client: AxiosInstance, id: string): Promise<Animal> => {
  const { data } = await client.delete<{ success: true; message: string; data: Animal }>(
    `/animals/${id}`,
  );
  return data.data;
};

/** PATCH /animals/:id/restore — used only as an immediate "Undo" right after delete; there is no backend capability to list soft-deleted animals afterward. */
export const restoreAnimal = async (client: AxiosInstance, id: string): Promise<Animal> => {
  const { data } = await client.patch<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/restore`,
  );
  return data.data;
};

const buildImagesFormData = (files: File[]): FormData => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return formData;
};

/** POST /animals/:id/images — multipart field "images" (array), max 8 total on the animal (400 past that). First-ever image is auto-marked primary and flips adoptionStatus "unavailable" -> "available". */
export const addAnimalImages = async (
  client: AxiosInstance,
  id: string,
  files: File[],
): Promise<Animal> => {
  const { data } = await client.post<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/images`,
    buildImagesFormData(files),
  );
  return data.data;
};

/** PATCH /animals/:id/images/:imageId — multipart field "image" (single); preserves the isPrimary flag of the replaced slot. */
export const replaceAnimalImage = async (
  client: AxiosInstance,
  id: string,
  imageId: string,
  file: File,
): Promise<Animal> => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await client.patch<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/images/${imageId}`,
    formData,
  );
  return data.data;
};

/** PATCH /animals/:id/images/:imageId/primary */
export const setPrimaryAnimalImage = async (
  client: AxiosInstance,
  id: string,
  imageId: string,
): Promise<Animal> => {
  const { data } = await client.patch<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/images/${imageId}/primary`,
  );
  return data.data;
};

/** DELETE /animals/:id/images/:imageId — if the deleted image was primary, the next remaining image becomes primary; if it was the last image, adoptionStatus is forced back to "unavailable". */
export const deleteAnimalImage = async (
  client: AxiosInstance,
  id: string,
  imageId: string,
): Promise<Animal> => {
  const { data } = await client.delete<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/images/${imageId}`,
  );
  return data.data;
};

/** DELETE /animals/:id/images — clears all images, forces adoptionStatus to "unavailable". 404 if the animal already has no images. */
export const deleteAllAnimalImages = async (client: AxiosInstance, id: string): Promise<Animal> => {
  const { data } = await client.delete<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/images`,
  );
  return data.data;
};
```

- [ ] **Step 2: Create `adoptionRequestShelter.ts`**

```ts
/**
 * Shelter-employee/superadmin endpoint functions for the shelter-facing
 * subset of src/routes/adoptionRequest.route.js. Kept separate from
 * ./adoptionRequests.ts, which is documented there as the adopter-facing
 * subset only.
 */
import type { AxiosInstance } from "axios";
import type { AdoptionRequestStatus, ShelterAdoptionRequest } from "@paw-match/types";

export interface ShelterAdoptionRequestsFilters {
  animalId?: string;
  adopterId?: string;
  status?: AdoptionRequestStatus;
}

/** GET /adoptions/shelter — shelterId is forced server-side to the caller's own shelter for a shelterEmployee (the shelterId query param is superadmin-only); no free-text search, no pagination. */
export const getShelterAdoptionRequests = async (
  client: AxiosInstance,
  filters: ShelterAdoptionRequestsFilters = {},
): Promise<ShelterAdoptionRequest[]> => {
  const { data } = await client.get<{ success: true; message: string; data: ShelterAdoptionRequest[] }>(
    "/adoptions/shelter",
    { params: filters },
  );
  return data.data;
};

/** PATCH /adoptions/:id/status — body status restricted by the backend to "interview" or "homeCheck" only, and only from the immediately-prior stage (pendingReview -> interview -> homeCheck). */
export const updateAdoptionRequestStatus = async (
  client: AxiosInstance,
  id: string,
  status: "interview" | "homeCheck",
): Promise<ShelterAdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: ShelterAdoptionRequest }>(
    `/adoptions/${id}/status`,
    { status },
  );
  return data.data;
};

/** PATCH /adoptions/:id/approve — only valid from status "homeCheck". Rejects every other active request for the same animal automatically. */
export const approveAdoptionRequest = async (
  client: AxiosInstance,
  id: string,
): Promise<ShelterAdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: ShelterAdoptionRequest }>(
    `/adoptions/${id}/approve`,
  );
  return data.data;
};

/** PATCH /adoptions/:id/reject — body rejectionReason required (3-1000 chars); only valid from pendingReview|interview|homeCheck. */
export const rejectAdoptionRequest = async (
  client: AxiosInstance,
  id: string,
  rejectionReason: string,
): Promise<ShelterAdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: ShelterAdoptionRequest }>(
    `/adoptions/${id}/reject`,
    { rejectionReason },
  );
  return data.data;
};

/** PATCH /adoptions/:id/complete — only valid from status "approved". */
export const completeAdoptionRequest = async (
  client: AxiosInstance,
  id: string,
): Promise<ShelterAdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: ShelterAdoptionRequest }>(
    `/adoptions/${id}/complete`,
  );
  return data.data;
};

/** PATCH /adoptions/:id/cancel-approval — body reason required (3-1000 chars); only valid from status "approved"; ends the request in status "rejected" (reuses that status value, not a distinct one). */
export const cancelApprovedAdoptionRequest = async (
  client: AxiosInstance,
  id: string,
  reason: string,
): Promise<ShelterAdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: ShelterAdoptionRequest }>(
    `/adoptions/${id}/cancel-approval`,
    { reason },
  );
  return data.data;
};
```

- [ ] **Step 3: Create `shelterEmployeeProfile.ts`**

```ts
/** Endpoint function for src/routes/profiles/shelterEmployeeProfile.routes.js's only shelterEmployee self-service route. */
import type { AxiosInstance } from "axios";
import type { ShelterEmployeeProfile } from "@paw-match/types";

/** GET /shelter-employee-profile/me — the only way a shelterEmployee learns their own shelter's id (data.shelterId._id, null if not yet assigned). 404 if no profile exists at all. */
export const getMyShelterEmployeeProfile = async (
  client: AxiosInstance,
): Promise<ShelterEmployeeProfile> => {
  const { data } = await client.get<{ success: true; message: string; data: ShelterEmployeeProfile }>(
    "/shelter-employee-profile/me",
  );
  return data.data;
};
```

- [ ] **Step 4: Create `shelterEmployeeShelter.ts`**

```ts
/**
 * GET /shelters/:id called by a shelterEmployee for their own shelter — the
 * backend returns the "shelterEmployee" accessLevel branch (employees
 * populated) rather than the adopter-facing AuthedShelterDetail shape that
 * ./shelters.ts's getShelterById is typed for. Kept separate for that
 * reason, same convention as every other admin/employee-facing split file.
 */
import type { AxiosInstance } from "axios";
import type { ShelterEmployeeShelterDetail } from "@paw-match/types";

export const getMyShelterDetail = async (
  client: AxiosInstance,
  id: string,
): Promise<ShelterEmployeeShelterDetail> => {
  const { data } = await client.get<{
    success: true;
    accessLevel: "shelterEmployee";
    data: ShelterEmployeeShelterDetail;
  }>(`/shelters/${id}`);
  return data.data;
};
```

- [ ] **Step 5: Export all four**

Add to `frontend/packages/api-client/src/index.ts` (after `export * from "./userManagement";`):
```ts
export * from "./animalManagement";
export * from "./adoptionRequestShelter";
export * from "./shelterEmployeeProfile";
export * from "./shelterEmployeeShelter";
```

- [ ] **Step 6: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/api-client`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/packages/api-client/src/animalManagement.ts frontend/packages/api-client/src/adoptionRequestShelter.ts frontend/packages/api-client/src/shelterEmployeeProfile.ts frontend/packages/api-client/src/shelterEmployeeShelter.ts frontend/packages/api-client/src/index.ts
git commit -m "feat(api-client): add shelter-employee animal/adoption-request/profile/shelter endpoints"
```

---

## Task 4: Query/mutation hooks

**Files:**
- Create: `frontend/packages/hooks/src/animalManagement.ts`
- Create: `frontend/packages/hooks/src/adoptionRequestShelter.ts`
- Create: `frontend/packages/hooks/src/shelterEmployeeProfile.ts`
- Create: `frontend/packages/hooks/src/shelterEmployeeShelter.ts`
- Modify: `frontend/packages/hooks/src/index.ts`
- Create: `frontend/apps/dashboard/src/lib/animalHooks.ts`
- Create: `frontend/apps/dashboard/src/lib/animalManagementHooks.ts`
- Create: `frontend/apps/dashboard/src/lib/adoptionRequestShelterHooks.ts`
- Create: `frontend/apps/dashboard/src/lib/shelterEmployeeProfileHooks.ts`
- Create: `frontend/apps/dashboard/src/lib/shelterEmployeeShelterHooks.ts`

- [ ] **Step 1: Create `packages/hooks/src/animalManagement.ts`**

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  addAnimalImages,
  createAnimal,
  deleteAllAnimalImages,
  deleteAnimal,
  deleteAnimalImage,
  replaceAnimalImage,
  restoreAnimal,
  setPrimaryAnimalImage,
  updateAnimal,
} from "@paw-match/api-client";
import type { AnimalPayload } from "@paw-match/types";

/** Mutation hook factory for shelter-employee/superadmin animal management, layered on top of @paw-match/hooks's existing read-only createAnimalHooks (useAnimals/useAnimal). */
export const createAnimalManagementHooks = (client: AxiosInstance) => {
  const invalidateAnimals = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["animals"] });

  const useCreateAnimal = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: AnimalPayload) => createAnimal(client, payload),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useUpdateAnimal = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: AnimalPayload }) =>
        updateAnimal(client, id, payload),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useDeleteAnimal = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => deleteAnimal(client, id),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useRestoreAnimal = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => restoreAnimal(client, id),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useAddAnimalImages = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, files }: { id: string; files: File[] }) => addAnimalImages(client, id, files),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useReplaceAnimalImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, imageId, file }: { id: string; imageId: string; file: File }) =>
        replaceAnimalImage(client, id, imageId, file),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useSetPrimaryAnimalImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
        setPrimaryAnimalImage(client, id, imageId),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useDeleteAnimalImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
        deleteAnimalImage(client, id, imageId),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useDeleteAllAnimalImages = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => deleteAllAnimalImages(client, id),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  return {
    useCreateAnimal,
    useUpdateAnimal,
    useDeleteAnimal,
    useRestoreAnimal,
    useAddAnimalImages,
    useReplaceAnimalImage,
    useSetPrimaryAnimalImage,
    useDeleteAnimalImage,
    useDeleteAllAnimalImages,
  };
};
```

- [ ] **Step 2: Create `packages/hooks/src/adoptionRequestShelter.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  approveAdoptionRequest,
  cancelApprovedAdoptionRequest,
  completeAdoptionRequest,
  getShelterAdoptionRequests,
  rejectAdoptionRequest,
  updateAdoptionRequestStatus,
  type ShelterAdoptionRequestsFilters,
} from "@paw-match/api-client";

/** Query/mutation hook factory for the shelter-facing adoption-request workflow. Every mutation invalidates both the shelter-requests list and animals (approve/complete/cancel-approval all change the linked animal's adoptionStatus). */
export const createAdoptionRequestShelterHooks = (client: AxiosInstance) => {
  const shelterRequestsKey = (filters: ShelterAdoptionRequestsFilters) =>
    ["adoptionRequests", "shelter", filters] as const;

  const useShelterAdoptionRequests = (filters: ShelterAdoptionRequestsFilters = {}) =>
    useQuery({
      queryKey: shelterRequestsKey(filters),
      queryFn: () => getShelterAdoptionRequests(client, filters),
    });

  const invalidateShelterRequests = (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ["adoptionRequests", "shelter"] });
    queryClient.invalidateQueries({ queryKey: ["animals"] });
  };

  const useUpdateAdoptionRequestStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: "interview" | "homeCheck" }) =>
        updateAdoptionRequestStatus(client, id, status),
      onSuccess: () => invalidateShelterRequests(queryClient),
    });
  };

  const useApproveAdoptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => approveAdoptionRequest(client, id),
      onSuccess: () => invalidateShelterRequests(queryClient),
    });
  };

  const useRejectAdoptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
        rejectAdoptionRequest(client, id, rejectionReason),
      onSuccess: () => invalidateShelterRequests(queryClient),
    });
  };

  const useCompleteAdoptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => completeAdoptionRequest(client, id),
      onSuccess: () => invalidateShelterRequests(queryClient),
    });
  };

  const useCancelApprovedAdoptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        cancelApprovedAdoptionRequest(client, id, reason),
      onSuccess: () => invalidateShelterRequests(queryClient),
    });
  };

  return {
    useShelterAdoptionRequests,
    useUpdateAdoptionRequestStatus,
    useApproveAdoptionRequest,
    useRejectAdoptionRequest,
    useCompleteAdoptionRequest,
    useCancelApprovedAdoptionRequest,
  };
};
```

- [ ] **Step 3: Create `packages/hooks/src/shelterEmployeeProfile.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getMyShelterEmployeeProfile } from "@paw-match/api-client";

export const createShelterEmployeeProfileHooks = (client: AxiosInstance) => {
  const useMyShelterEmployeeProfile = () =>
    useQuery({
      queryKey: ["shelterEmployeeProfile", "me"],
      queryFn: () => getMyShelterEmployeeProfile(client),
    });

  return { useMyShelterEmployeeProfile };
};
```

- [ ] **Step 4: Create `packages/hooks/src/shelterEmployeeShelter.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getMyShelterDetail } from "@paw-match/api-client";

export const createShelterEmployeeShelterHooks = (client: AxiosInstance) => {
  const useMyShelterDetail = (id: string | undefined) =>
    useQuery({
      queryKey: ["shelters", "employee-detail", id],
      queryFn: () => getMyShelterDetail(client, id as string),
      enabled: Boolean(id),
    });

  return { useMyShelterDetail };
};
```

- [ ] **Step 5: Export all four**

Add to `frontend/packages/hooks/src/index.ts` (after `export * from "./userManagement";`):
```ts
export * from "./animalManagement";
export * from "./adoptionRequestShelter";
export * from "./shelterEmployeeProfile";
export * from "./shelterEmployeeShelter";
```

- [ ] **Step 6: Wire all five into the Dashboard app**

Create `frontend/apps/dashboard/src/lib/animalHooks.ts`:
```ts
import { createAnimalHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const animalHooks = createAnimalHooks(apiClient);
```

Create `frontend/apps/dashboard/src/lib/animalManagementHooks.ts`:
```ts
import { createAnimalManagementHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const animalManagementHooks = createAnimalManagementHooks(apiClient);
```

Create `frontend/apps/dashboard/src/lib/adoptionRequestShelterHooks.ts`:
```ts
import { createAdoptionRequestShelterHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const adoptionRequestShelterHooks = createAdoptionRequestShelterHooks(apiClient);
```

Create `frontend/apps/dashboard/src/lib/shelterEmployeeProfileHooks.ts`:
```ts
import { createShelterEmployeeProfileHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const shelterEmployeeProfileHooks = createShelterEmployeeProfileHooks(apiClient);
```

Create `frontend/apps/dashboard/src/lib/shelterEmployeeShelterHooks.ts`:
```ts
import { createShelterEmployeeShelterHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const shelterEmployeeShelterHooks = createShelterEmployeeShelterHooks(apiClient);
```

- [ ] **Step 7: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/hooks && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/packages/hooks/src/animalManagement.ts frontend/packages/hooks/src/adoptionRequestShelter.ts frontend/packages/hooks/src/shelterEmployeeProfile.ts frontend/packages/hooks/src/shelterEmployeeShelter.ts frontend/packages/hooks/src/index.ts frontend/apps/dashboard/src/lib/animalHooks.ts frontend/apps/dashboard/src/lib/animalManagementHooks.ts frontend/apps/dashboard/src/lib/adoptionRequestShelterHooks.ts frontend/apps/dashboard/src/lib/shelterEmployeeProfileHooks.ts frontend/apps/dashboard/src/lib/shelterEmployeeShelterHooks.ts
git commit -m "feat(hooks): add shelter-employee animal/adoption-request/profile/shelter hooks"
```

---

## Task 5: Shared `ImageUploader` component + `Modal` size variant

**Files:**
- Modify: `frontend/packages/ui/src/Modal.tsx`
- Create: `frontend/packages/ui/src/ImageUploader.tsx`
- Modify: `frontend/packages/ui/src/index.ts`

- [ ] **Step 1: Add a `size` variant to the shared `Modal`**

The animal create/edit form (Task 8) needs a wider dialog than the `max-w-lg` every existing Modal
use case fits in. Layering a wider `className` override on top of the hardcoded `max-w-lg` would risk
the exact class-cascade conflict already caught and fixed in Phase 2 (two `max-w-*`/`bg-*` utilities
on one element, order not guaranteed) — so this adds a proper `size` prop instead, mirroring
`button-variants.ts`'s variant/size map pattern.

In `frontend/packages/ui/src/Modal.tsx`, change:
```tsx
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}
```
to:
```tsx
export type ModalSize = "md" | "lg";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  md: "max-w-lg",
  lg: "max-w-2xl",
};
```

Then change the component signature from:
```tsx
export const Modal = ({ isOpen, onClose, title, children, footer, className }: ModalProps) => {
```
to:
```tsx
export const Modal = ({ isOpen, onClose, title, children, footer, size = "md", className }: ModalProps) => {
```

And change the dialog panel's `className`:
```tsx
            className={cn(
              "relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl",
              className,
            )}
```
to:
```tsx
            className={cn(
              "relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl",
              sizeClasses[size],
              className,
            )}
```

- [ ] **Step 2: Create the `ImageUploader` component**

```tsx
import { useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@paw-match/utilities";
import { VisuallyHidden } from "./VisuallyHidden";

export interface ImageUploaderProps {
  label: string;
  hideLabel?: boolean;
  /** Add to the existing selection on each pick; false replaces it (single-file mode). */
  multiple?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string | null;
  files: File[];
  onFilesChange: (files: File[]) => void;
  className?: string;
}

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/gif,image/webp";

/**
 * Generic staged-file picker with thumbnail previews and per-file removal —
 * the caller owns when to actually upload the staged files (mirrors the
 * "pick, preview, then Save" flow already used by the Public Website's
 * ProfileImageManager, generalized to support multiple files). Manages its
 * own object-URL preview lifecycle; the caller only ever deals in `File[]`.
 */
export const ImageUploader = ({
  label,
  hideLabel = false,
  multiple = false,
  disabled = false,
  hint,
  error,
  files,
  onFilesChange,
  className,
}: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const staged = useMemo(
    () => files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => {
      staged.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    };
  }, [staged]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;

    onFilesChange(multiple ? [...files, ...selected] : selected);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <Upload className="h-4 w-4" aria-hidden />
        {hideLabel ? <VisuallyHidden>{label}</VisuallyHidden> : label}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          multiple={multiple}
          className="sr-only"
          onChange={handleChange}
          disabled={disabled}
        />
      </label>

      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {staged.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {staged.map(({ file, previewUrl }, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200"
            >
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Export `ImageUploader`**

Add to `frontend/packages/ui/src/index.ts` (after `export * from "./RowActionsMenu";`):
```ts
export * from "./ImageUploader";
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/ui`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/packages/ui/src/Modal.tsx frontend/packages/ui/src/ImageUploader.tsx frontend/packages/ui/src/index.ts
git commit -m "feat(ui): add shared ImageUploader component and a Modal size variant"
```

---

## Task 6: Route path + Shelter Employee Overview

**Files:**
- Modify: `frontend/apps/dashboard/src/routes/paths.ts`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/RecentRecordsFeed.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/ShelterEmployeeOverview.tsx`
- Modify: `frontend/apps/dashboard/src/pages/OverviewPage.tsx`

- [ ] **Step 1: Add the Shelter Employees team path**

In `frontend/apps/dashboard/src/routes/paths.ts`, change:
```ts
  // shelterEmployee
  myShelter: "/shelter",
  animals: "/animals",
  adoptionRequests: "/adoption-requests",
```
to:
```ts
  // shelterEmployee
  myShelter: "/shelter",
  shelterEmployees: "/shelter/employees",
  animals: "/animals",
  adoptionRequests: "/adoption-requests",
```

- [ ] **Step 2: Create `RecentRecordsFeed.tsx`**

```tsx
import { ClipboardList, PawPrint } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, ListSkeleton } from "@paw-match/ui";
import type { Animal, ShelterAdoptionRequest } from "@paw-match/types";

export interface RecentRecordsFeedProps {
  animals: Animal[] | undefined;
  requests: ShelterAdoptionRequest[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface RecordItem {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  icon: typeof PawPrint;
}

const RECENT_ANIMALS_COUNT = 5;
const RECENT_REQUESTS_COUNT = 5;
const MAX_FEED_ITEMS = 8;

/** Derived from the shelter's most recently added animals + most recent adoption requests — there is no dedicated activity/audit-log endpoint on the backend. */
const buildRecordItems = (animals: Animal[], requests: ShelterAdoptionRequest[]): RecordItem[] => {
  const animalItems: RecordItem[] = animals.slice(0, RECENT_ANIMALS_COUNT).map((animal) => ({
    id: `animal-${animal._id}`,
    title: `New animal added: ${animal.name}`,
    subtitle: `${animal.breed} · ${animal.species}`,
    createdAt: animal.createdAt,
    icon: PawPrint,
  }));

  const requestItems: RecordItem[] = requests.slice(0, RECENT_REQUESTS_COUNT).map((request) => ({
    id: `request-${request._id}`,
    title: `Adoption request for ${request.animalId.name}`,
    subtitle: `${request.adopterId.firstName} ${request.adopterId.lastName}`,
    createdAt: request.createdAt,
    icon: ClipboardList,
  }));

  return [...animalItems, ...requestItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_FEED_ITEMS);
};

/** Not a real activity/audit trail — the backend has no such endpoint. This is a derived approximation from recently added animals and adoption requests. */
export const RecentRecordsFeed = ({ animals, requests, isLoading, isError, onRetry }: RecentRecordsFeedProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  if (isLoading) {
    return <ListSkeleton count={4} label="Loading recent records" />;
  }

  if (isError) {
    return <ErrorState title="Couldn't load recent records" onRetry={onRetry} />;
  }

  const items = buildRecordItems(animals ?? [], requests ?? []);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No recent records yet"
        description="New animals and adoption requests will show up here."
      />
    );
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
            <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
          </div>
          <span className="shrink-0 text-xs text-slate-400">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </motion.li>
      ))}
    </ul>
  );
};
```

- [ ] **Step 3: Create `ShelterEmployeeOverview.tsx`**

```tsx
import { useMemo } from "react";
import { Building2, CheckCircle2, ClipboardList, PawPrint, ShieldAlert } from "lucide-react";
import { EmptyState, ErrorState, Spinner } from "@paw-match/ui";
import { StatCard } from "../../components/dashboard/StatCard";
import { QuickLinkCard } from "../../components/dashboard/QuickLinkCard";
import { RecentRecordsFeed } from "./components/RecentRecordsFeed";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { shelterEmployeeShelterHooks } from "../../lib/shelterEmployeeShelterHooks";
import { animalHooks } from "../../lib/animalHooks";
import { adoptionRequestShelterHooks } from "../../lib/adoptionRequestShelterHooks";
import { paths } from "../../routes/paths";

const NEEDS_REVIEW_STATUSES = ["pendingReview", "interview", "homeCheck"] as const;

const quickLinks = [
  {
    label: "My Shelter",
    description: "View your shelter's profile and team.",
    to: paths.myShelter,
    icon: Building2,
  },
  {
    label: "Animals",
    description: "List new animals and keep profiles up to date.",
    to: paths.animals,
    icon: PawPrint,
  },
  {
    label: "Adoption Requests",
    description: "Review, interview, and approve incoming requests.",
    to: paths.adoptionRequests,
    icon: ClipboardList,
  },
];

/** Statistics and recent records are both derived client-side from the shelter's own animals/adoption-requests lists — there is no dashboard-stats or activity-log endpoint on the backend. */
export const ShelterEmployeeOverview = () => {
  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile();
  const shelterId = profileQuery.data?.shelterId?._id;

  const shelterQuery = shelterEmployeeShelterHooks.useMyShelterDetail(shelterId);
  const animalsQuery = animalHooks.useAnimals({ shelterId }, { enabled: Boolean(shelterId) });
  const requestsQuery = adoptionRequestShelterHooks.useShelterAdoptionRequests();

  const stats = useMemo(() => {
    const animals = animalsQuery.data ?? [];
    const requests = requestsQuery.data ?? [];

    return {
      totalAnimals: animals.length,
      availableAnimals: animals.filter((animal) => animal.adoptionStatus === "available").length,
      totalRequests: requests.length,
      needsReview: requests.filter((request) =>
        (NEEDS_REVIEW_STATUSES as readonly string[]).includes(request.status),
      ).length,
    };
  }, [animalsQuery.data, requestsQuery.data]);

  if (profileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading your shelter overview…" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="mt-8">
        <ErrorState title="Couldn't load your shelter profile" onRetry={() => profileQuery.refetch()} />
      </div>
    );
  }

  if (!shelterId) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" aria-hidden />}
          title="You're not assigned to a shelter yet"
          description="Contact your administrator to be added to a shelter."
        />
      </div>
    );
  }

  const hasStatsError = shelterQuery.isError || animalsQuery.isError || requestsQuery.isError;
  const isStatsLoading = shelterQuery.isLoading || animalsQuery.isLoading || requestsQuery.isLoading;

  const handleRetry = () => {
    shelterQuery.refetch();
    animalsQuery.refetch();
    requestsQuery.refetch();
  };

  return (
    <div className="mt-8 flex flex-col gap-8">
      {shelterQuery.data && (
        <div className="rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
          <p className="text-sm text-slate-500">Your shelter</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{shelterQuery.data.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{shelterQuery.data.city}</p>
        </div>
      )}

      {hasStatsError ? (
        <ErrorState title="Couldn't load shelter statistics" onRetry={handleRetry} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total animals" value={isStatsLoading ? "…" : stats.totalAnimals} icon={PawPrint} index={0} />
          <StatCard
            label="Available"
            value={isStatsLoading ? "…" : stats.availableAnimals}
            icon={CheckCircle2}
            tone="accent"
            index={1}
          />
          <StatCard label="Total requests" value={isStatsLoading ? "…" : stats.totalRequests} icon={ClipboardList} index={2} />
          <StatCard
            label="Needs review"
            value={isStatsLoading ? "…" : stats.needsReview}
            icon={ClipboardList}
            tone="accent"
            index={3}
          />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recent records</h2>
        <div className="mt-4">
          <RecentRecordsFeed
            animals={animalsQuery.data}
            requests={requestsQuery.data}
            isLoading={isStatsLoading}
            isError={hasStatsError}
            onRetry={handleRetry}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link, index) => (
            <QuickLinkCard key={link.to} {...link} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Modify `OverviewPage.tsx`**

Replace the entire file content with:
```tsx
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Star, UserRound } from "lucide-react";
import { Badge } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { UserRole } from "@paw-match/types";
import { useAuth } from "../lib/auth";
import { paths } from "../routes/paths";
import { QuickLinkCard } from "../components/dashboard/QuickLinkCard";
import { SuperAdminOverview } from "./superadmin/SuperAdminOverview";
import { ShelterEmployeeOverview } from "./shelterEmployee/ShelterEmployeeOverview";

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
      ) : role === "shelterEmployee" ? (
        <ShelterEmployeeOverview />
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
git add frontend/apps/dashboard/src/routes/paths.ts frontend/apps/dashboard/src/pages/shelterEmployee/components/RecentRecordsFeed.tsx frontend/apps/dashboard/src/pages/shelterEmployee/ShelterEmployeeOverview.tsx frontend/apps/dashboard/src/pages/OverviewPage.tsx
git commit -m "feat(dashboard): add Shelter Employee Overview stats, recent records, and quick actions"
```

---

## Task 7: My Shelter (read-only) + Shelter Employees (read-only team)

**Files:**
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/MyShelterPage.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/ShelterEmployeesPage.tsx`

- [ ] **Step 1: Create `MyShelterPage.tsx`**

```tsx
import { Building2, Mail, MapPin, Phone, Users } from "lucide-react";
import { Badge, ButtonLink, EmptyState, ErrorState, Spinner } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { ShelterEmployeeShelterDetail } from "@paw-match/types";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { shelterEmployeeShelterHooks } from "../../lib/shelterEmployeeShelterHooks";
import { paths } from "../../routes/paths";

const verificationTone: Record<ShelterEmployeeShelterDetail["verificationStatus"], BadgeTone> = {
  pending: "neutral",
  approved: "brand",
  rejected: "danger",
};

/** Read-only this phase — editing, logo, and gallery management are excluded (see the design spec's Manager-gate bug finding). */
const MyShelterPage = () => {
  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile();
  const shelterId = profileQuery.data?.shelterId?._id;
  const shelterQuery = shelterEmployeeShelterHooks.useMyShelterDetail(shelterId);

  if (profileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading your shelter…" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => profileQuery.refetch()} />;
  }

  if (!shelterId) {
    return (
      <EmptyState
        title="You're not assigned to a shelter yet"
        description="Contact your administrator to be added to a shelter."
      />
    );
  }

  if (shelterQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading shelter details…" />
      </div>
    );
  }

  if (shelterQuery.isError || !shelterQuery.data) {
    return <ErrorState title="Couldn't load your shelter" onRetry={() => shelterQuery.refetch()} />;
  }

  const shelter = shelterQuery.data;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{shelter.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={verificationTone[shelter.verificationStatus]}>{shelter.verificationStatus}</Badge>
            <Badge tone={shelter.isActive ? "accent" : "neutral"}>
              {shelter.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <ButtonLink to={paths.shelterEmployees} variant="secondary">
          <Users className="h-4 w-4" aria-hidden />
          View team
        </ButtonLink>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
                  <dd className="text-sm font-medium text-slate-700">{shelter.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Phone</dt>
                  <dd className="text-sm font-medium text-slate-700">{shelter.phone}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Address</dt>
                  <dd className="text-sm font-medium text-slate-700">
                    {shelter.address}, {shelter.city}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Operating hours &amp; capacity</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Hours</dt>
                <dd className="text-sm font-medium text-slate-700">
                  {shelter.operatingHours.open && shelter.operatingHours.close
                    ? `${shelter.operatingHours.open} - ${shelter.operatingHours.close}`
                    : "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Capacity</dt>
                <dd className="text-sm font-medium text-slate-700">{shelter.capacity}</dd>
              </div>
            </dl>

            {shelter.supportedSpecies.length > 0 && (
              <div className="mt-4">
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
          </div>

          {shelter.description && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{shelter.description}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Logo</h2>
            <div className="mt-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
              {shelter.logo ? (
                <img src={shelter.logo.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-slate-300" aria-hidden />
              )}
            </div>
          </div>

          {shelter.images.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {shelter.images.map((image) => (
                  <img key={image.publicId} src={image.url} alt="" className="h-20 w-full rounded-lg object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyShelterPage;
```

- [ ] **Step 2: Create `ShelterEmployeesPage.tsx`**

```tsx
import { Users } from "lucide-react";
import { Badge, EmptyState, ErrorState, Spinner, UserAvatar } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { ShelterTeamMemberRef, UserRole } from "@paw-match/types";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { shelterEmployeeShelterHooks } from "../../lib/shelterEmployeeShelterHooks";

const roleTone: Record<UserRole, BadgeTone> = {
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

const isRealMember = (member: ShelterTeamMemberRef | null): member is ShelterTeamMemberRef => member !== null;

/**
 * Read-only team directory — add/remove is excluded this phase (the
 * backend's Manager-permission gate is broken, see the design spec).
 * Position/hire-date aren't shown: looking up another employee's profile is
 * superadmin-only, so only name/email/phone/role/active-status (from the
 * shelter's own `employees` populate) are available here.
 */
const ShelterEmployeesPage = () => {
  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile();
  const shelterId = profileQuery.data?.shelterId?._id;
  const shelterQuery = shelterEmployeeShelterHooks.useMyShelterDetail(shelterId);

  if (profileQuery.isLoading || (Boolean(shelterId) && shelterQuery.isLoading)) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading your shelter's team…" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => profileQuery.refetch()} />;
  }

  if (!shelterId) {
    return (
      <EmptyState
        title="You're not assigned to a shelter yet"
        description="Contact your administrator to be added to a shelter."
      />
    );
  }

  if (shelterQuery.isError || !shelterQuery.data) {
    return <ErrorState title="Couldn't load your shelter's team" onRetry={() => shelterQuery.refetch()} />;
  }

  const team = shelterQuery.data.employees.filter(isRealMember);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Shelter Team</h1>
      <p className="mt-2 max-w-xl text-slate-600">Everyone currently assigned to {shelterQuery.data.name}.</p>

      <div className="mt-8">
        {team.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden />}
            title="No team members yet"
            description="Employees added to this shelter will show up here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <UserAvatar firstName={member.firstName} lastName={member.lastName} profileImage={member.profileImage} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-500">{member.email}</p>
                  {member.phone && <p className="truncate text-xs text-slate-500">{member.phone}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge tone={roleTone[member.role]}>{roleLabel[member.role]}</Badge>
                  <Badge tone={member.isActive ? "accent" : "neutral"}>
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelterEmployeesPage;
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/dashboard/src/pages/shelterEmployee/MyShelterPage.tsx frontend/apps/dashboard/src/pages/shelterEmployee/ShelterEmployeesPage.tsx
git commit -m "feat(dashboard): add read-only My Shelter and Shelter Employees team pages"
```

---

## Task 8: Animals Management

**Files:**
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalsFilters.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalCard.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalCardSkeleton.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalFormModal.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalImagesModal.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalQuickViewModal.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/DeleteAnimalDialog.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/AnimalsPage.tsx`

- [ ] **Step 1: Create `AnimalsFilters.tsx`**

```tsx
import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface AnimalsFiltersValue {
  search: string;
  species: string;
  adoptionStatus: string;
  healthStatus: string;
  sort: string;
}

export interface AnimalsFiltersProps {
  value: AnimalsFiltersValue;
  onChange: (value: AnimalsFiltersValue) => void;
}

const speciesOptions = [
  { label: "Dogs", value: "dog" },
  { label: "Cats", value: "cat" },
  { label: "Birds", value: "bird" },
  { label: "Rabbits", value: "rabbit" },
  { label: "Fish", value: "fish" },
  { label: "Other", value: "other" },
];

const adoptionStatusOptions = [
  { label: "Available", value: "available" },
  { label: "Pending", value: "pending" },
  { label: "Adopted", value: "adopted" },
  { label: "Unavailable", value: "unavailable" },
];

const healthStatusOptions = [
  { label: "Healthy", value: "healthy" },
  { label: "Needs care", value: "needsCare" },
  { label: "Special needs", value: "specialNeeds" },
  { label: "Under treatment", value: "underTreatment" },
];

const sortOptions = [
  { label: "Newest first", value: "newest" },
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Age (youngest first)", value: "age-asc" },
  { label: "Age (oldest first)", value: "age-desc" },
];

/** search/species/adoptionStatus/healthStatus map to real GET /animals query params; sort is entirely client-side (no server-side sort exists). Gender/size/vaccinated filters exist on the backend too but are deliberately left out of this filter bar to keep it usable — narrower than the full backend capability, not a gap. */
export const AnimalsFilters = ({ value, onChange }: AnimalsFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <Input
      label="Search animals"
      hideLabel
      placeholder="Search by name, breed, or description"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
    />
    <Select
      label="Species"
      hideLabel
      placeholder="All species"
      options={speciesOptions}
      value={value.species}
      onChange={(event) => onChange({ ...value, species: event.target.value })}
    />
    <Select
      label="Adoption status"
      hideLabel
      placeholder="All adoption statuses"
      options={adoptionStatusOptions}
      value={value.adoptionStatus}
      onChange={(event) => onChange({ ...value, adoptionStatus: event.target.value })}
    />
    <Select
      label="Health status"
      hideLabel
      placeholder="All health statuses"
      options={healthStatusOptions}
      value={value.healthStatus}
      onChange={(event) => onChange({ ...value, healthStatus: event.target.value })}
    />
    <Select
      label="Sort"
      hideLabel
      options={sortOptions}
      value={value.sort}
      onChange={(event) => onChange({ ...value, sort: event.target.value })}
    />
  </div>
);
```

- [ ] **Step 2: Create `AnimalCard.tsx`**

```tsx
import { motion, useReducedMotion } from "framer-motion";
import { Edit, Eye, Images, PawPrint, Trash2 } from "lucide-react";
import { Badge, Card, RowActionsMenu } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { Animal } from "@paw-match/types";

const adoptionStatusTone: Record<Animal["adoptionStatus"], BadgeTone> = {
  available: "accent",
  pending: "brand",
  adopted: "neutral",
  unavailable: "neutral",
};

const adoptionStatusLabel: Record<Animal["adoptionStatus"], string> = {
  available: "Available",
  pending: "Pending adoption",
  adopted: "Adopted",
  unavailable: "Unavailable",
};

const healthStatusLabel: Record<Animal["healthStatus"], string> = {
  healthy: "Healthy",
  needsCare: "Needs care",
  specialNeeds: "Special needs",
  underTreatment: "Under treatment",
};

export interface AnimalCardProps {
  animal: Animal;
  index?: number;
  onView: () => void;
  onEdit: () => void;
  onManageImages: () => void;
  onDelete: () => void;
}

/**
 * Dashboard-specific — distinct from the Public Website's adopter-facing
 * AnimalCard (that one links to a detail page and has no action menu; this
 * one is a management surface, not a navigable link). Visual language
 * (image-led card, status badge overlay) is deliberately the same.
 */
export const AnimalCard = ({ animal, index = 0, onView, onEdit, onManageImages, onDelete }: AnimalCardProps) => {
  const reduceMotion = Boolean(useReducedMotion());
  const primaryImage = animal.images.find((image) => image.isPrimary) ?? animal.images[0];

  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.04 }}
    >
      <Card padding="none" className="h-full overflow-hidden">
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          {primaryImage ? (
            <img src={primaryImage.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <PawPrint className="h-10 w-10" aria-hidden />
            </div>
          )}
          <span className="absolute right-3 top-3">
            <Badge tone={adoptionStatusTone[animal.adoptionStatus]}>
              {adoptionStatusLabel[animal.adoptionStatus]}
            </Badge>
          </span>
          <span className="absolute left-2 top-2 rounded-full bg-white/90 shadow-md">
            <RowActionsMenu
              label={`More actions for ${animal.name}`}
              actions={[
                { label: "View", icon: Eye, onClick: onView },
                { label: "Edit", icon: Edit, onClick: onEdit },
                { label: "Manage images", icon: Images, onClick: onManageImages },
                {
                  label: "Delete",
                  icon: Trash2,
                  tone: "danger",
                  disabled: animal.adoptionStatus === "adopted",
                  disabledReason: "Adopted animals cannot be deleted",
                  onClick: onDelete,
                },
              ]}
            />
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="text-lg font-semibold text-slate-900">{animal.name}</h3>
          <p className="text-sm text-slate-600">
            {animal.breed} · {animal.age} {animal.ageUnit}
          </p>

          <div className="mt-1 flex flex-wrap gap-2">
            <Badge tone="neutral" className="capitalize">
              {animal.species}
            </Badge>
            <Badge tone="neutral" className="capitalize">
              {animal.gender}
            </Badge>
            <Badge tone="neutral">{healthStatusLabel[animal.healthStatus]}</Badge>
            {!animal.isActive && <Badge tone="danger">Inactive</Badge>}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
```

- [ ] **Step 3: Create `AnimalCardSkeleton.tsx`**

```tsx
import { Skeleton } from "@paw-match/ui";

/** Dashboard-specific loading placeholder, shaped like AnimalCard (same spirit as the Public Website's AnimalCardSkeleton, adapted to this card's slightly different layout). */
export const AnimalCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <Skeleton className="h-44 w-full rounded-none" />
    <div className="flex flex-col gap-2 p-5">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <div className="mt-1 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  </div>
);
```

- [ ] **Step 4: Create `AnimalFormModal.tsx`**

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal, Select, Textarea } from "@paw-match/ui";
import { animalFormSchema } from "@paw-match/validation";
import type { AnimalFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { Animal, AnimalPayload } from "@paw-match/types";
import { animalManagementHooks } from "../../../lib/animalManagementHooks";

export interface AnimalFormModalProps {
  isOpen: boolean;
  animal: Animal | null;
  onClose: () => void;
}

const speciesOptions = [
  { label: "Dog", value: "dog" },
  { label: "Cat", value: "cat" },
  { label: "Bird", value: "bird" },
  { label: "Rabbit", value: "rabbit" },
  { label: "Fish", value: "fish" },
  { label: "Other", value: "other" },
];

const ageUnitOptions = [
  { label: "Months", value: "months" },
  { label: "Years", value: "years" },
];

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const sizeOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const healthStatusOptions = [
  { label: "Healthy", value: "healthy" },
  { label: "Needs care", value: "needsCare" },
  { label: "Special needs", value: "specialNeeds" },
  { label: "Under treatment", value: "underTreatment" },
];

const yesNoOptions = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

const homeTypeOptions = [
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Farm", value: "farm" },
  { label: "Any", value: "any" },
];

const experienceLevelOptions = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert", value: "expert" },
  { label: "Any", value: "any" },
];

const activityLevelOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const ownerTypeOptions = [
  { label: "Single", value: "single" },
  { label: "Family", value: "family" },
  { label: "Any", value: "any" },
];

const defaultValues: AnimalFormValues = {
  name: "",
  age: 0,
  ageUnit: "years",
  species: "dog",
  breed: "",
  gender: "male",
  size: "medium",
  color: "",
  healthStatus: "healthy",
  vaccinated: "false",
  description: "",
  homeType: "any",
  suitableForKids: "false",
  goodWithOtherPets: "false",
  experienceLevel: "any",
  dailyActivityLevel: "medium",
  ownerType: "any",
  hypoallergenic: "false",
};

const toFormValues = (animal: Animal): AnimalFormValues => ({
  name: animal.name,
  age: animal.age,
  ageUnit: animal.ageUnit,
  species: animal.species,
  breed: animal.breed,
  gender: animal.gender,
  size: animal.size,
  color: animal.color,
  healthStatus: animal.healthStatus,
  vaccinated: animal.vaccinated ? "true" : "false",
  description: animal.description ?? "",
  homeType: animal.requirements.homeType,
  suitableForKids: animal.requirements.suitableForKids ? "true" : "false",
  goodWithOtherPets: animal.requirements.goodWithOtherPets ? "true" : "false",
  experienceLevel: animal.requirements.experienceLevel,
  dailyActivityLevel: animal.requirements.dailyActivityLevel,
  ownerType: animal.requirements.ownerType,
  hypoallergenic: animal.requirements.hypoallergenic ? "true" : "false",
});

const toPayload = (values: AnimalFormValues): AnimalPayload => ({
  name: values.name,
  age: values.age,
  ageUnit: values.ageUnit,
  species: values.species,
  breed: values.breed,
  gender: values.gender,
  size: values.size,
  color: values.color,
  healthStatus: values.healthStatus,
  vaccinated: values.vaccinated === "true",
  description: values.description || undefined,
  requirements: {
    homeType: values.homeType,
    suitableForKids: values.suitableForKids === "true",
    goodWithOtherPets: values.goodWithOtherPets === "true",
    experienceLevel: values.experienceLevel,
    dailyActivityLevel: values.dailyActivityLevel,
    ownerType: values.ownerType,
    hypoallergenic: values.hypoallergenic === "true",
  },
});

/** Covers both create and edit — the edit form always sends the full field set (see AnimalPayload's doc comment), never a partial diff. */
export const AnimalFormModal = ({ isOpen, animal, onClose }: AnimalFormModalProps) => {
  const createMutation = animalManagementHooks.useCreateAnimal();
  const updateMutation = animalManagementHooks.useUpdateAnimal();
  const mutation = animal ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnimalFormValues>({ resolver: zodResolver(animalFormSchema), defaultValues });

  useEffect(() => {
    if (isOpen) reset(animal ? toFormValues(animal) : defaultValues);
  }, [isOpen, animal, reset]);

  const onSubmit = (values: AnimalFormValues) => {
    const payload = toPayload(values);

    if (animal) {
      updateMutation.mutate({ id: animal._id, payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={animal ? `Edit ${animal.name}` : "Add a new animal"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={mutation.isPending}>
            {animal ? "Save changes" : "Add animal"}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        {!animal && (
          <p className="text-sm text-slate-600">
            New animals stay unavailable for adoption until you add at least one photo.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Breed" error={errors.breed?.message} {...register("breed")} />
          <Input
            label="Age"
            type="number"
            min={0}
            step="0.1"
            error={errors.age?.message}
            {...register("age", { valueAsNumber: true })}
          />
          <Select label="Age unit" options={ageUnitOptions} error={errors.ageUnit?.message} {...register("ageUnit")} />
          <Select label="Species" options={speciesOptions} error={errors.species?.message} {...register("species")} />
          <Select label="Gender" options={genderOptions} error={errors.gender?.message} {...register("gender")} />
          <Select label="Size" options={sizeOptions} error={errors.size?.message} {...register("size")} />
          <Input label="Color" error={errors.color?.message} {...register("color")} />
          <Select
            label="Health status"
            options={healthStatusOptions}
            error={errors.healthStatus?.message}
            {...register("healthStatus")}
          />
          <Select
            label="Vaccinated"
            options={yesNoOptions}
            error={errors.vaccinated?.message}
            {...register("vaccinated")}
          />
        </div>

        <Textarea label="Description" rows={3} error={errors.description?.message} {...register("description")} />

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Adoption requirements</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Select
              label="Home type"
              options={homeTypeOptions}
              error={errors.homeType?.message}
              {...register("homeType")}
            />
            <Select
              label="Owner type"
              options={ownerTypeOptions}
              error={errors.ownerType?.message}
              {...register("ownerType")}
            />
            <Select
              label="Experience level"
              options={experienceLevelOptions}
              error={errors.experienceLevel?.message}
              {...register("experienceLevel")}
            />
            <Select
              label="Daily activity level"
              options={activityLevelOptions}
              error={errors.dailyActivityLevel?.message}
              {...register("dailyActivityLevel")}
            />
            <Select
              label="Suitable for kids"
              options={yesNoOptions}
              error={errors.suitableForKids?.message}
              {...register("suitableForKids")}
            />
            <Select
              label="Good with other pets"
              options={yesNoOptions}
              error={errors.goodWithOtherPets?.message}
              {...register("goodWithOtherPets")}
            />
            <Select
              label="Hypoallergenic"
              options={yesNoOptions}
              error={errors.hypoallergenic?.message}
              {...register("hypoallergenic")}
            />
          </div>
        </div>

        {mutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
```

- [ ] **Step 5: Create `AnimalImagesModal.tsx`**

```tsx
import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { Button, ImageUploader, Modal } from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { Animal } from "@paw-match/types";
import { animalManagementHooks } from "../../../lib/animalManagementHooks";

export interface AnimalImagesModalProps {
  animal: Animal | null;
  onClose: () => void;
}

const MAX_ANIMAL_IMAGES = 8;

/** Add/replace/set-primary/delete-one/delete-all — all confirmed reachable by any active shelterEmployee of the owning shelter (no Manager gate, unlike shelter logo/gallery). */
export const AnimalImagesModal = ({ animal, onClose }: AnimalImagesModalProps) => {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const addImagesMutation = animalManagementHooks.useAddAnimalImages();
  const setPrimaryMutation = animalManagementHooks.useSetPrimaryAnimalImage();
  const deleteImageMutation = animalManagementHooks.useDeleteAnimalImage();
  const deleteAllMutation = animalManagementHooks.useDeleteAllAnimalImages();

  const isMutating =
    addImagesMutation.isPending ||
    setPrimaryMutation.isPending ||
    deleteImageMutation.isPending ||
    deleteAllMutation.isPending;

  const handleClose = () => {
    setStagedFiles([]);
    onClose();
  };

  const handleUpload = () => {
    if (!animal || stagedFiles.length === 0) return;
    addImagesMutation.mutate(
      { id: animal._id, files: stagedFiles },
      { onSuccess: () => setStagedFiles([]) },
    );
  };

  const remainingSlots = animal ? MAX_ANIMAL_IMAGES - animal.images.length : 0;
  const mutationError =
    addImagesMutation.error ?? setPrimaryMutation.error ?? deleteImageMutation.error ?? deleteAllMutation.error;

  return (
    <Modal
      isOpen={Boolean(animal)}
      onClose={handleClose}
      title={animal ? `Manage images for ${animal.name}` : "Manage images"}
      size="lg"
    >
      {animal && (
        <div className="flex flex-col gap-6">
          {animal.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {animal.images.map((image) => (
                <div key={image._id} className="relative overflow-hidden rounded-lg border border-slate-200">
                  <img src={image.url} alt="" className="h-24 w-full object-cover" />
                  {image.isPrimary && (
                    <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">
                      <Star className="h-3 w-3" aria-hidden />
                      Primary
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-slate-900/60 p-1">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        disabled={isMutating}
                        onClick={() => setPrimaryMutation.mutate({ id: animal._id, imageId: image._id })}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-white/20"
                      >
                        Set primary
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => deleteImageMutation.mutate({ id: animal._id, imageId: image._id })}
                      className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-white/20"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {remainingSlots > 0 ? (
            <ImageUploader
              label="Choose images"
              multiple
              disabled={isMutating}
              hint={`JPEG, PNG, GIF, or WebP. Up to ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"}.`}
              files={stagedFiles}
              onFilesChange={setStagedFiles}
            />
          ) : (
            <p className="text-sm text-slate-500">
              This animal already has the maximum of {MAX_ANIMAL_IMAGES} images.
            </p>
          )}

          {mutationError && (
            <p role="alert" className="text-sm text-red-600">
              {getApiErrorMessage(mutationError)}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <Button
              variant="secondary"
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={isMutating || animal.images.length === 0}
              onClick={() => deleteAllMutation.mutate(animal._id)}
            >
              Delete all images
            </Button>
            <Button disabled={stagedFiles.length === 0} isLoading={addImagesMutation.isPending} onClick={handleUpload}>
              Upload{stagedFiles.length > 0 ? ` (${stagedFiles.length})` : ""}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
```

- [ ] **Step 6: Create `AnimalQuickViewModal.tsx`**

```tsx
import { Badge, Modal } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { Animal } from "@paw-match/types";

export interface AnimalQuickViewModalProps {
  animal: Animal | null;
  onClose: () => void;
}

const adoptionStatusTone: Record<Animal["adoptionStatus"], BadgeTone> = {
  available: "accent",
  pending: "brand",
  adopted: "neutral",
  unavailable: "neutral",
};

const healthStatusLabel: Record<Animal["healthStatus"], string> = {
  healthy: "Healthy",
  needsCare: "Needs care",
  specialNeeds: "Special needs",
  underTreatment: "Under treatment",
};

/** Read-only preview built entirely from data already present in the animals list response — no additional API calls. */
export const AnimalQuickViewModal = ({ animal, onClose }: AnimalQuickViewModalProps) => (
  <Modal isOpen={Boolean(animal)} onClose={onClose} title={animal?.name ?? "Animal details"}>
    {animal && (
      <div className="flex flex-col gap-4">
        {animal.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {animal.images.map((image) => (
              <img key={image._id} src={image.url} alt="" className="h-20 w-full rounded-lg object-cover" />
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge tone={adoptionStatusTone[animal.adoptionStatus]} className="capitalize">
            {animal.adoptionStatus}
          </Badge>
          <Badge tone={animal.isActive ? "accent" : "neutral"}>{animal.isActive ? "Active" : "Inactive"}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Species</dt>
            <dd className="mt-0.5 font-medium capitalize text-slate-700">{animal.species}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Breed</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{animal.breed}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Age</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {animal.age} {animal.ageUnit}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Gender</dt>
            <dd className="mt-0.5 font-medium capitalize text-slate-700">{animal.gender}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Size</dt>
            <dd className="mt-0.5 font-medium capitalize text-slate-700">{animal.size}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Color</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{animal.color}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Health status</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{healthStatusLabel[animal.healthStatus]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Vaccinated</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{animal.vaccinated ? "Yes" : "No"}</dd>
          </div>
        </dl>

        {animal.description && <p className="text-sm leading-relaxed text-slate-600">{animal.description}</p>}

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Adoption requirements</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="neutral" className="capitalize">
              {animal.requirements.homeType} home
            </Badge>
            <Badge tone="neutral" className="capitalize">
              {animal.requirements.experienceLevel} experience
            </Badge>
            <Badge tone="neutral" className="capitalize">
              {animal.requirements.dailyActivityLevel} activity
            </Badge>
            {animal.requirements.suitableForKids && <Badge tone="neutral">Good with kids</Badge>}
            {animal.requirements.goodWithOtherPets && <Badge tone="neutral">Good with other pets</Badge>}
            {animal.requirements.hypoallergenic && <Badge tone="neutral">Hypoallergenic</Badge>}
          </div>
        </div>
      </div>
    )}
  </Modal>
);
```

- [ ] **Step 7: Create `DeleteAnimalDialog.tsx`**

```tsx
import { useState } from "react";
import { AlertTriangle, Undo2 } from "lucide-react";
import { Button, Modal } from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { Animal } from "@paw-match/types";
import { animalManagementHooks } from "../../../lib/animalManagementHooks";

export interface DeleteAnimalDialogProps {
  animal: Animal | null;
  onClose: () => void;
}

/**
 * Soft delete only. Immediately after a successful delete, offers a
 * session-only "Undo" (calls the real restore endpoint) — there is no
 * backend capability to list soft-deleted animals afterward (GET /animals
 * and GET /animals/:id both force isActive:true for a shelterEmployee), so
 * this is the only way back, and only until this component's state resets
 * (navigating away, or deleting another animal).
 */
export const DeleteAnimalDialog = ({ animal, onClose }: DeleteAnimalDialogProps) => {
  const [deletedAnimalId, setDeletedAnimalId] = useState<string | null>(null);
  const deleteMutation = animalManagementHooks.useDeleteAnimal();
  const restoreMutation = animalManagementHooks.useRestoreAnimal();

  const handleConfirm = () => {
    if (!animal) return;
    deleteMutation.mutate(animal._id, {
      onSuccess: () => {
        setDeletedAnimalId(animal._id);
        onClose();
      },
    });
  };

  const handleUndo = () => {
    if (!deletedAnimalId) return;
    restoreMutation.mutate(deletedAnimalId, { onSuccess: () => setDeletedAnimalId(null) });
  };

  return (
    <>
      <Modal
        isOpen={Boolean(animal)}
        onClose={onClose}
        title={animal ? `Delete ${animal.name}` : "Delete animal"}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="border-red-300 text-red-700 hover:bg-red-50"
              isLoading={deleteMutation.isPending}
              onClick={handleConfirm}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
            <p className="text-sm text-red-800">
              This removes the animal from every list. You'll be able to undo this immediately after,
              but not later.
            </p>
          </div>
          {deleteMutation.isError && (
            <p role="alert" className="text-sm text-red-600">
              {getApiErrorMessage(deleteMutation.error)}
            </p>
          )}
        </div>
      </Modal>

      {deletedAnimalId && (
        <div className="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-lg">
          <p className="text-sm text-slate-700">Animal deleted.</p>
          <Button variant="ghost" size="sm" isLoading={restoreMutation.isPending} onClick={handleUndo}>
            <Undo2 className="h-4 w-4" aria-hidden />
            Undo
          </Button>
        </div>
      )}
    </>
  );
};
```

Note: `variant="secondary" className="border-red-300 text-red-700 hover:bg-red-50"` on the Cancel/Delete
buttons above is safe (not the same risk as Phase 2's caught bug) — `secondary`'s own classes are
`border-slate-300 bg-white text-slate-900 hover:bg-slate-50`, and the override only touches
`border-color`/`text-color`/`hover:background`, never colliding with `bg-white` (no competing
`bg-*` utility is added), so there's no two-utilities-for-the-same-property conflict.

- [ ] **Step 8: Create `AnimalsPage.tsx`**

```tsx
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button, EmptyState, ErrorState, Pagination, Spinner } from "@paw-match/ui";
import { useDebouncedValue } from "@paw-match/hooks";
import type { AdoptionStatus, Animal, Species } from "@paw-match/types";
import { animalHooks } from "../../lib/animalHooks";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { AnimalsFilters } from "./components/AnimalsFilters";
import type { AnimalsFiltersValue } from "./components/AnimalsFilters";
import { AnimalCard } from "./components/AnimalCard";
import { AnimalCardSkeleton } from "./components/AnimalCardSkeleton";
import { AnimalFormModal } from "./components/AnimalFormModal";
import { AnimalImagesModal } from "./components/AnimalImagesModal";
import { AnimalQuickViewModal } from "./components/AnimalQuickViewModal";
import { DeleteAnimalDialog } from "./components/DeleteAnimalDialog";

const PAGE_SIZE = 9;

const emptyFilters: AnimalsFiltersValue = {
  search: "",
  species: "",
  adoptionStatus: "",
  healthStatus: "",
  sort: "newest",
};

const sortAnimals = (animals: Animal[], sort: string): Animal[] => {
  const sorted = [...animals];
  switch (sort) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "age-asc":
      return sorted.sort((a, b) => a.age - b.age);
    case "age-desc":
      return sorted.sort((a, b) => b.age - a.age);
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};

const AnimalsPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile();
  const shelterId = profileQuery.data?.shelterId?._id;

  const [filters, setFilters] = useState<AnimalsFiltersValue>(emptyFilters);
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<{ open: boolean; animal: Animal | null }>({
    open: false,
    animal: null,
  });
  const [viewTarget, setViewTarget] = useState<Animal | null>(null);
  const [imagesTarget, setImagesTarget] = useState<Animal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Animal | null>(null);

  const animalsQuery = animalHooks.useAnimals(
    {
      shelterId,
      search: debouncedSearch || undefined,
      species: (filters.species || undefined) as Species | undefined,
      adoptionStatus: (filters.adoptionStatus || undefined) as AdoptionStatus | undefined,
      healthStatus: filters.healthStatus || undefined,
    },
    { enabled: Boolean(shelterId) },
  );

  const sortedAnimals = useMemo(
    () => sortAnimals(animalsQuery.data ?? [], filters.sort),
    [animalsQuery.data, filters.sort],
  );

  const totalPages = Math.max(1, Math.ceil(sortedAnimals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedAnimals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: AnimalsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => profileQuery.refetch()} />;
  }

  if (!shelterId) {
    return (
      <EmptyState
        title="You're not assigned to a shelter yet"
        description="Contact your administrator to be added to a shelter."
      />
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Animals</h1>
          <p className="mt-2 max-w-xl text-slate-600">List new animals and keep profiles up to date.</p>
        </div>
        <Button onClick={() => setFormTarget({ open: true, animal: null })}>
          <Plus className="h-4 w-4" aria-hidden />
          Add animal
        </Button>
      </div>

      <div className="mt-6">
        <AnimalsFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {animalsQuery.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <AnimalCardSkeleton key={index} />
            ))}
          </div>
        )}

        {animalsQuery.isError && <ErrorState title="Couldn't load animals" onRetry={() => animalsQuery.refetch()} />}

        {animalsQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No animals match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {animalsQuery.isSuccess && pageItems.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((animal, index) => (
                <AnimalCard
                  key={animal._id}
                  animal={animal}
                  index={index}
                  onView={() => setViewTarget(animal)}
                  onEdit={() => setFormTarget({ open: true, animal })}
                  onManageImages={() => setImagesTarget(animal)}
                  onDelete={() => setDeleteTarget(animal)}
                />
              ))}
            </div>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>

      <AnimalFormModal
        isOpen={formTarget.open}
        animal={formTarget.animal}
        onClose={() => setFormTarget({ open: false, animal: null })}
      />
      <AnimalQuickViewModal animal={viewTarget} onClose={() => setViewTarget(null)} />
      <AnimalImagesModal animal={imagesTarget} onClose={() => setImagesTarget(null)} />
      <DeleteAnimalDialog animal={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </motion.div>
  );
};

export default AnimalsPage;
```

- [ ] **Step 9: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalsFilters.tsx frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalCard.tsx frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalCardSkeleton.tsx frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalFormModal.tsx frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalImagesModal.tsx frontend/apps/dashboard/src/pages/shelterEmployee/components/AnimalQuickViewModal.tsx frontend/apps/dashboard/src/pages/shelterEmployee/components/DeleteAnimalDialog.tsx frontend/apps/dashboard/src/pages/shelterEmployee/AnimalsPage.tsx
git commit -m "feat(dashboard): add Animals Management page"
```

---

## Task 9: Adoption Requests Management

**Files:**
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/AdoptionRequestsFilters.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/AdoptionRequestQuickViewModal.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/RejectAdoptionRequestDialog.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/CancelApprovalDialog.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/components/AdoptionRequestsTable.tsx`
- Create: `frontend/apps/dashboard/src/pages/shelterEmployee/AdoptionRequestsPage.tsx`

- [ ] **Step 1: Create `AdoptionRequestsFilters.tsx`**

```tsx
import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface AdoptionRequestsFiltersValue {
  search: string;
  status: string;
}

export interface AdoptionRequestsFiltersProps {
  value: AdoptionRequestsFiltersValue;
  onChange: (value: AdoptionRequestsFiltersValue) => void;
}

const statusOptions = [
  { label: "Pending review", value: "pendingReview" },
  { label: "Interview", value: "interview" },
  { label: "Home check", value: "homeCheck" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Completed", value: "completed" },
];

/** status maps to the real GET /adoptions/shelter query param; search (adopter name/email, animal name) is entirely client-side — the backend has no free-text search for this endpoint. */
export const AdoptionRequestsFilters = ({ value, onChange }: AdoptionRequestsFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <Input
      label="Search requests"
      hideLabel
      placeholder="Search by adopter or animal name"
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

- [ ] **Step 2: Create `AdoptionRequestQuickViewModal.tsx`**

```tsx
import { Badge, Modal } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { ShelterAdoptionRequest } from "@paw-match/types";

export interface AdoptionRequestQuickViewModalProps {
  request: ShelterAdoptionRequest | null;
  onClose: () => void;
}

const statusTone: Record<ShelterAdoptionRequest["status"], BadgeTone> = {
  pendingReview: "neutral",
  interview: "accent",
  homeCheck: "accent",
  approved: "brand",
  rejected: "danger",
  cancelled: "neutral",
  completed: "brand",
};

const statusLabel: Record<ShelterAdoptionRequest["status"], string> = {
  pendingReview: "Pending review",
  interview: "Interview",
  homeCheck: "Home check",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
};

/** Read-only preview built entirely from data already present in the shelter adoption-requests list response — no additional API calls. */
export const AdoptionRequestQuickViewModal = ({ request, onClose }: AdoptionRequestQuickViewModalProps) => (
  <Modal
    isOpen={Boolean(request)}
    onClose={onClose}
    title={
      request ? `Request from ${request.adopterId.firstName} ${request.adopterId.lastName}` : "Request details"
    }
  >
    {request && (
      <div className="flex flex-col gap-4">
        <Badge tone={statusTone[request.status]}>{statusLabel[request.status]}</Badge>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Adopter email</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{request.adopterId.email}</dd>
          </div>
          {request.adopterId.phone && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Adopter phone</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{request.adopterId.phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Animal</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {request.animalId.name} ({request.animalId.breed})
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Requested</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {new Date(request.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        {request.message && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Message from adopter</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{request.message}</p>
          </div>
        )}

        {request.rejectionReason && (
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection reason</p>
            <p className="mt-1 text-sm text-red-800">{request.rejectionReason}</p>
          </div>
        )}
      </div>
    )}
  </Modal>
);
```

- [ ] **Step 3: Create `RejectAdoptionRequestDialog.tsx`**

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { rejectAdoptionRequestSchema } from "@paw-match/validation";
import type { RejectAdoptionRequestFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { ShelterAdoptionRequest } from "@paw-match/types";
import { adoptionRequestShelterHooks } from "../../../lib/adoptionRequestShelterHooks";

export interface RejectAdoptionRequestDialogProps {
  request: ShelterAdoptionRequest | null;
  onClose: () => void;
}

/** Only valid from pendingReview|interview|homeCheck — the backend rejects otherwise (409). */
export const RejectAdoptionRequestDialog = ({ request, onClose }: RejectAdoptionRequestDialogProps) => {
  const rejectMutation = adoptionRequestShelterHooks.useRejectAdoptionRequest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectAdoptionRequestFormValues>({ resolver: zodResolver(rejectAdoptionRequestSchema) });

  useEffect(() => {
    if (request) reset({ rejectionReason: "" });
  }, [request, reset]);

  const onSubmit = (values: RejectAdoptionRequestFormValues) => {
    if (!request) return;
    rejectMutation.mutate(
      { id: request._id, rejectionReason: values.rejectionReason },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      isOpen={Boolean(request)}
      onClose={onClose}
      title={
        request
          ? `Reject request from ${request.adopterId.firstName} ${request.adopterId.lastName}`
          : "Reject request"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={rejectMutation.isPending}>
            Reject request
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

- [ ] **Step 4: Create `CancelApprovalDialog.tsx`**

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { cancelApprovedRequestSchema } from "@paw-match/validation";
import type { CancelApprovedRequestFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { ShelterAdoptionRequest } from "@paw-match/types";
import { adoptionRequestShelterHooks } from "../../../lib/adoptionRequestShelterHooks";

export interface CancelApprovalDialogProps {
  request: ShelterAdoptionRequest | null;
  onClose: () => void;
}

/** Only valid from status "approved". Ends the request in status "rejected" (the backend reuses that value — there's no distinct "cancelled-approval" status) and flips the animal back to "available". */
export const CancelApprovalDialog = ({ request, onClose }: CancelApprovalDialogProps) => {
  const cancelMutation = adoptionRequestShelterHooks.useCancelApprovedAdoptionRequest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelApprovedRequestFormValues>({ resolver: zodResolver(cancelApprovedRequestSchema) });

  useEffect(() => {
    if (request) reset({ reason: "" });
  }, [request, reset]);

  const onSubmit = (values: CancelApprovedRequestFormValues) => {
    if (!request) return;
    cancelMutation.mutate({ id: request._id, reason: values.reason }, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(request)}
      onClose={onClose}
      title={
        request
          ? `Cancel approval for ${request.adopterId.firstName} ${request.adopterId.lastName}`
          : "Cancel approval"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={cancelMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={cancelMutation.isPending}>
            Cancel approval
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-slate-600">
          This makes the animal available again and marks this request as rejected. A reason is required.
        </p>
        <Textarea label="Reason" rows={4} error={errors.reason?.message} {...register("reason")} />
        {cancelMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(cancelMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
```

- [ ] **Step 5: Create `AdoptionRequestsTable.tsx`**

```tsx
import { useState } from "react";
import { CheckCircle2, Eye, RotateCcw, XCircle } from "lucide-react";
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
import type { ShelterAdoptionRequest } from "@paw-match/types";
import { adoptionRequestShelterHooks } from "../../../lib/adoptionRequestShelterHooks";
import { AdoptionRequestQuickViewModal } from "./AdoptionRequestQuickViewModal";
import { RejectAdoptionRequestDialog } from "./RejectAdoptionRequestDialog";
import { CancelApprovalDialog } from "./CancelApprovalDialog";

const statusTone: Record<ShelterAdoptionRequest["status"], BadgeTone> = {
  pendingReview: "neutral",
  interview: "accent",
  homeCheck: "accent",
  approved: "brand",
  rejected: "danger",
  cancelled: "neutral",
  completed: "brand",
};

const statusLabel: Record<ShelterAdoptionRequest["status"], string> = {
  pendingReview: "Pending review",
  interview: "Interview",
  homeCheck: "Home check",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
};

export interface AdoptionRequestsTableProps {
  requests: ShelterAdoptionRequest[];
}

/** Only shows the exact next actions valid for each request's current status, per the backend's confirmed transition rules — never an action that would 400/409. */
export const AdoptionRequestsTable = ({ requests }: AdoptionRequestsTableProps) => {
  const [viewTarget, setViewTarget] = useState<ShelterAdoptionRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ShelterAdoptionRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ShelterAdoptionRequest | null>(null);

  const statusMutation = adoptionRequestShelterHooks.useUpdateAdoptionRequestStatus();
  const approveMutation = adoptionRequestShelterHooks.useApproveAdoptionRequest();
  const completeMutation = adoptionRequestShelterHooks.useCompleteAdoptionRequest();

  return (
    <>
      <Table>
        <TableHead>
          <TableHeaderCell>Adopter</TableHeaderCell>
          <TableHeaderCell>Animal</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Requested</TableHeaderCell>
          <TableHeaderCell>
            <VisuallyHidden>Actions</VisuallyHidden>
          </TableHeaderCell>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    firstName={request.adopterId.firstName}
                    lastName={request.adopterId.lastName}
                    profileImage={request.adopterId.profileImage}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {request.adopterId.firstName} {request.adopterId.lastName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{request.adopterId.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium text-slate-900">{request.animalId.name}</p>
                <p className="text-xs capitalize text-slate-500">{request.animalId.species}</p>
              </TableCell>
              <TableCell>
                <Badge tone={statusTone[request.status]}>{statusLabel[request.status]}</Badge>
              </TableCell>
              <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1.5">
                  {request.status === "pendingReview" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={statusMutation.isPending && statusMutation.variables?.id === request._id}
                        onClick={() => statusMutation.mutate({ id: request._id, status: "interview" })}
                      >
                        Move to interview
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setRejectTarget(request)}>
                        <XCircle className="h-4 w-4" aria-hidden />
                        Reject
                      </Button>
                    </>
                  )}

                  {request.status === "interview" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={statusMutation.isPending && statusMutation.variables?.id === request._id}
                        onClick={() => statusMutation.mutate({ id: request._id, status: "homeCheck" })}
                      >
                        Move to home check
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setRejectTarget(request)}>
                        <XCircle className="h-4 w-4" aria-hidden />
                        Reject
                      </Button>
                    </>
                  )}

                  {request.status === "homeCheck" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={approveMutation.isPending && approveMutation.variables === request._id}
                        onClick={() => approveMutation.mutate(request._id)}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Approve
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setRejectTarget(request)}>
                        <XCircle className="h-4 w-4" aria-hidden />
                        Reject
                      </Button>
                    </>
                  )}

                  {request.status === "approved" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={completeMutation.isPending && completeMutation.variables === request._id}
                        onClick={() => completeMutation.mutate(request._id)}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Complete
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setCancelTarget(request)}>
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Cancel approval
                      </Button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setViewTarget(request)}
                    aria-label={`View request from ${request.adopterId.firstName} ${request.adopterId.lastName}`}
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

      <AdoptionRequestQuickViewModal request={viewTarget} onClose={() => setViewTarget(null)} />
      <RejectAdoptionRequestDialog request={rejectTarget} onClose={() => setRejectTarget(null)} />
      <CancelApprovalDialog request={cancelTarget} onClose={() => setCancelTarget(null)} />
    </>
  );
};
```

- [ ] **Step 6: Create `AdoptionRequestsPage.tsx`**

```tsx
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, Pagination, Spinner, TableSkeleton } from "@paw-match/ui";
import type { AdoptionRequestStatus } from "@paw-match/types";
import { adoptionRequestShelterHooks } from "../../lib/adoptionRequestShelterHooks";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { AdoptionRequestsFilters } from "./components/AdoptionRequestsFilters";
import type { AdoptionRequestsFiltersValue } from "./components/AdoptionRequestsFilters";
import { AdoptionRequestsTable } from "./components/AdoptionRequestsTable";

const PAGE_SIZE = 10;
const REQUESTS_TABLE_COLUMN_COUNT = 5;

const emptyFilters: AdoptionRequestsFiltersValue = { search: "", status: "" };

const AdoptionRequestsPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile();
  const shelterId = profileQuery.data?.shelterId?._id;

  const [filters, setFilters] = useState<AdoptionRequestsFiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);

  const requestsQuery = adoptionRequestShelterHooks.useShelterAdoptionRequests(
    filters.status ? { status: filters.status as AdoptionRequestStatus } : {},
  );

  const filteredRequests = useMemo(() => {
    const requests = requestsQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    if (search.length === 0) return requests;

    return requests.filter((request) => {
      const adopterName = `${request.adopterId.firstName} ${request.adopterId.lastName}`.toLowerCase();
      return (
        adopterName.includes(search) ||
        request.adopterId.email.toLowerCase().includes(search) ||
        request.animalId.name.toLowerCase().includes(search)
      );
    });
  }, [requestsQuery.data, filters.search]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: AdoptionRequestsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => profileQuery.refetch()} />;
  }

  if (!shelterId) {
    return (
      <EmptyState
        title="You're not assigned to a shelter yet"
        description="Contact your administrator to be added to a shelter."
      />
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Adoption Requests</h1>
      <p className="mt-2 max-w-xl text-slate-600">Review, interview, and approve incoming requests.</p>

      <div className="mt-6">
        <AdoptionRequestsFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {requestsQuery.isLoading && <TableSkeleton columns={REQUESTS_TABLE_COLUMN_COUNT} rows={PAGE_SIZE} />}

        {requestsQuery.isError && (
          <ErrorState title="Couldn't load adoption requests" onRetry={() => requestsQuery.refetch()} />
        )}

        {requestsQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No adoption requests match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {requestsQuery.isSuccess && pageItems.length > 0 && (
          <>
            <AdoptionRequestsTable requests={pageItems} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdoptionRequestsPage;
```

- [ ] **Step 7: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/apps/dashboard/src/pages/shelterEmployee/components/AdoptionRequestsFilters.tsx frontend/apps/dashboard/src/pages/shelterEmployee/components/AdoptionRequestQuickViewModal.tsx frontend/apps/dashboard/src/pages/shelterEmployee/components/RejectAdoptionRequestDialog.tsx frontend/apps/dashboard/src/pages/shelterEmployee/components/CancelApprovalDialog.tsx frontend/apps/dashboard/src/pages/shelterEmployee/components/AdoptionRequestsTable.tsx frontend/apps/dashboard/src/pages/shelterEmployee/AdoptionRequestsPage.tsx
git commit -m "feat(dashboard): add Adoption Requests Management page"
```

---

## Task 10: Wire the new pages into routing

**Files:**
- Modify: `frontend/apps/dashboard/src/App.tsx`

- [ ] **Step 1: Add lazy imports**

In `frontend/apps/dashboard/src/App.tsx`, add these four lines alongside the other `lazy(() =>
import(...))` declarations (after the `UsersPage` lazy import line):
```tsx
const MyShelterPage = lazy(() => import("./pages/shelterEmployee/MyShelterPage"));
const ShelterEmployeesPage = lazy(() => import("./pages/shelterEmployee/ShelterEmployeesPage"));
const AnimalsPage = lazy(() => import("./pages/shelterEmployee/AnimalsPage"));
const AdoptionRequestsPage = lazy(() => import("./pages/shelterEmployee/AdoptionRequestsPage"));
```

- [ ] **Step 2: Replace the `ComingSoonPage` routes for `shelter`/`animals`/`adoption-requests`**

Find this block (inside the `shelterEmployee`-gated `<Route>`):
```tsx
            <Route element={<RequireRole roles={["shelterEmployee"]} redirectTo={paths.home} />}>
              <Route
                path="shelter"
                element={<ComingSoonPage title="My Shelter" description="Manage your shelter's profile, logo, and photos." />}
              />
              <Route
                path="animals"
                element={<ComingSoonPage title="Animals" description="List new animals and keep profiles up to date." />}
              />
              <Route
                path="adoption-requests"
                element={<ComingSoonPage title="Adoption Requests" description="Review, interview, and approve incoming requests." />}
              />
            </Route>
```
Replace it with:
```tsx
            <Route element={<RequireRole roles={["shelterEmployee"]} redirectTo={paths.home} />}>
              <Route path="shelter">
                <Route index element={<MyShelterPage />} />
                <Route path="employees" element={<ShelterEmployeesPage />} />
              </Route>
              <Route path="animals" element={<AnimalsPage />} />
              <Route path="adoption-requests" element={<AdoptionRequestsPage />} />
            </Route>
```

This makes `/shelter` render `MyShelterPage` and `/shelter/employees` render `ShelterEmployeesPage`,
both still gated by the same `RequireRole roles={["shelterEmployee"]}` guard as before — no change to
guard structure, only to which element renders.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck --workspace=@paw-match/dashboard`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/dashboard/src/App.tsx
git commit -m "feat(dashboard): route My Shelter, Shelter Employees, Animals, and Adoption Requests to the new Shelter Employee pages"
```

---

## Task 11: Full workspace verification

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
particular, the `Modal` size-variant change and the `AdminShelter`/`Animal`/`AdoptionRequest` type
additions from this plan must not affect any existing adopter-facing usage).

- [ ] **Step 4: Manual dev-server verification**

Run: `cd frontend/apps/dashboard && npx vite --port <a free port>` (in the background), then, while
it's running, using the existing seeded shelterEmployee-role account(s) if available (read-only —
no new accounts, no seeding, per the standing DB-read-only-during-testing policy):
- Confirm `/` shows Welcome header, shelter summary card (or the "not assigned to a shelter" empty
  state if the signed-in account has no shelter), 4 stat cards, Recent Records section, and 3 Quick
  Action cards.
- Confirm `/shelter` shows the read-only shelter profile (contact, address, hours, capacity,
  species, logo/gallery) with a working "View team" link, and that there is no edit/logo/photo
  action anywhere on the page.
- Confirm `/shelter/employees` shows the read-only team list (name/email/phone/role/active-status
  only — no position, no add/remove control anywhere).
- Confirm `/animals` shows the card grid with search/species/adoption-status/health-status filters
  and sort, that Add/Edit/Manage images/Delete all work end-to-end against the real backend, that a
  newly created animal shows as "Unavailable" until an image is added, that Delete shows the
  session-only Undo toast and Undo actually restores the animal, and that empty/loading/error states
  render correctly.
- Confirm `/adoption-requests` shows the table with search/status filters, that only the
  backend-valid next actions appear per request status, and that Reject/Cancel-approval require a
  reason and surface the backend's error message on failure.
- Confirm signing in as `superadmin` or `vet` still behaves exactly as before (unaffected by this
  phase), and that visiting `/shelter`, `/shelter/employees`, `/animals`, or `/adoption-requests` as
  either of those roles redirects to `/unauthorized`.
- Stop the dev server afterward.

- [ ] **Step 5: Responsive check**

With the dev server running, check the Animals card grid and the Adoption Requests table at 375px,
768px, 1024px, and 1440px: confirm no horizontal page overflow, the animal card grid reflows
1 → 2 → 3 columns, the adoption-requests table scrolls inside its own container rather than the
page, and filter controls stack sensibly on narrow widths.

- [ ] **Step 6: Verify query invalidation**

Confirm (via the React Query devtools or simply observing the UI update without a manual refresh)
that: creating/editing/deleting/restoring an animal refreshes the Animals list and the Overview's
animal stats; approving/rejecting/completing/cancelling an adoption request refreshes both the
Adoption Requests list and the Animals list (since the linked animal's `adoptionStatus` changes too)
and the Overview's request stats.

- [ ] **Step 7: Report results**

Summarize: typecheck result, all three build results, and what was manually verified vs. anything
that couldn't be verified (e.g. no shelterEmployee test account with animals/requests already seeded
would limit how much of the live workflow could be exercised without creating data, which the
DB-read-only-during-testing policy prohibits).

---

## Self-review notes (completed during planning, not a task to execute)

- **Spec coverage:** Shelter Employee Overview (welcome/shelter summary/animal stats/request
  stats/recent records/quick actions) → Task 6. My Shelter (read-only) and Shelter Employees
  (read-only team) → Task 7. Animals Management (search/filters/sort/pagination/card
  grid/quick-view/create/edit/delete+undo/image management) → Tasks 5 (ImageUploader) + 8. Adoption
  Requests Management (search/filters/quick-view/status actions/reject/cancel-approval) → Task 9.
  Shared data layer (types/validation/api-client/hooks) → Tasks 1-4. Routing → Task 10. All two
  backend limitations (Manager-gate bug, no soft-deleted-animal visibility) are reflected as
  explicit scope exclusions/design choices, not silently worked around.
- **No placeholders:** every step shows complete file content or an exact diff; no "add error
  handling"/"TBD" phrasing appears.
- **Type consistency:** `AnimalPayload` (Task 1) is the single payload shape used identically by
  `createAnimal`/`updateAnimal` (Task 3), `useCreateAnimal`/`useUpdateAnimal` (Task 4), and
  `AnimalFormModal`'s `toPayload` (Task 8) — never redefined differently. `ShelterAdoptionRequest`
  (Task 1) is the one type used across the shelter-facing api-client (Task 3), hooks (Task 4), and
  every adoption-request component (Task 9). `ShelterEmployeeShelterDetail`/`ShelterTeamMemberRef`
  (Task 1) are shared identically by `MyShelterPage` and `ShelterEmployeesPage` (Task 7), both
  reading from the same `shelterEmployeeShelterHooks.useMyShelterDetail` call. Mutation variable
  shapes (`{id, payload}`, `{id, files}`, `{id, imageId}`, `{id, imageId, file}`, `{id, status}`,
  `{id, rejectionReason}`, `{id, reason}`) match exactly between hook definitions (Task 4) and every
  call site (Tasks 6, 8, 9).
- **Class-cascade risk avoided twice:** the `Modal` size variant (Task 5) prevents the same
  two-conflicting-utilities bug caught in Phase 2's plan; the `DeleteAnimalDialog`/`AnimalImagesModal`
  color overrides (Task 8) were checked against `Button`'s `secondary` variant classes and confirmed
  not to collide (no competing `bg-*` utility introduced).
