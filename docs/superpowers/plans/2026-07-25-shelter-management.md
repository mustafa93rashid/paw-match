# Shelter Management (Super Admin + Shelter Employee) — Discovery & Plan

**Status:** Discovery complete. Stopped for approval before coding, per instruction.

---

## 1. Backend permission matrix (every route in shelter.route.js)

| Route | Route-level roles | Controller-level extra check | Effective access **today** |
|---|---|---|---|
| `GET /shelters` | none (public) | approved+verified+active filter | Public Website only |
| `GET /shelters/nearest` | none (public) | same filter | Public Website only |
| `POST /shelters` | superadmin, shelterEmployee | shelterEmployee: needs an **active** `ShelterEmployeeProfile` with `shelterId === null`, else 404/409 | **Both roles work** |
| `GET /shelters/admin/all` | superadmin | none | superadmin only |
| `GET /shelters/:id` | any authenticated | branches internally: superadmin → full; shelterEmployee → full *only if* an active profile links them to *this* shelter; everyone else → public tier (only if approved/verified/active) | **Works correctly for all roles today** |
| `PATCH /shelters/:id` | superadmin, shelterEmployee | `checkShelterEmployeePermission` | superadmin only (see §4 — broken for shelterEmployee) |
| `PATCH /shelters/:id/approve` | superadmin | none | superadmin only |
| `PATCH /shelters/:id/reject` | superadmin | none | superadmin only |
| `PATCH /shelters/:id/status` | superadmin | none | superadmin only |
| `DELETE /shelters/:id/permanent` | superadmin | none | superadmin only |
| `PATCH /shelters/:id/employees` | superadmin, shelterEmployee | `checkShelterEmployeePermission` | superadmin only (broken) |
| `DELETE /shelters/:id/employees/:employeeId` | superadmin, shelterEmployee | `checkShelterEmployeePermission` + self-removal blocked | superadmin only (broken) |
| `PATCH /shelters/:id/logo` | superadmin, shelterEmployee | `checkShelterEmployeePermission` | superadmin only (broken) |
| `PATCH /shelters/:id/logo/replace` | superadmin, shelterEmployee | `checkShelterEmployeePermission` | superadmin only (broken) |
| `DELETE /shelters/:id/logo` | superadmin, shelterEmployee | `checkShelterEmployeePermission` | superadmin only (broken) |
| `POST /shelters/:id/images` | superadmin, shelterEmployee | `checkShelterEmployeePermission` | superadmin only (broken) |
| `DELETE /shelters/:id/images/:publicId` | superadmin, shelterEmployee | `checkShelterEmployeePermission` **+ reads `publicId` from `req.body`, not the URL param** | superadmin only (broken); see §4 for the body/param note |

`checkShelterEmployeePermission(user, shelter)`: returns `true` immediately for `role === "superadmin"`. For `shelterEmployee`, requires (a) the user's id is in `shelter.employees`, (b) an active `ShelterEmployeeProfile` exists with `shelterId` matching this shelter **and `position: "Manager"`**.

## 2. Existing frontend coverage matrix

| Capability | Superadmin | ShelterEmployee |
|---|---|---|
| List + filter shelters | ✅ `SheltersPage`/`SheltersTable` (Phase 2) | — |
| View shelter details | ✅ `ShelterQuickViewModal` (Phase 2) | ✅ `MyShelterPage` (Phase 3, read-only) |
| Approve | ✅ (Phase 2) | n/a (never permitted) |
| Reject with reason | ✅ `RejectShelterDialog` (Phase 2) | n/a |
| Activate/deactivate | ✅ (Phase 2) | n/a |
| Permanent delete | ✅ `DeleteShelterDialog` (Phase 2) | n/a |
| Manage employees | ✅ `ManageShelterEmployeesModal` (Phase 6) | ❌ (Phase 3 explicitly left read-only, documented bug) |
| Create shelter | ❌ missing | ❌ missing |
| Edit shelter | ❌ missing | ❌ missing (blocked anyway, see §4) |
| Logo upload/replace/delete | ❌ missing | ❌ missing (blocked anyway) |
| Gallery add/delete | ❌ missing | ❌ missing (blocked anyway) |
| Team directory (read) | n/a | ✅ `ShelterEmployeesPage` (Phase 3, read-only) |

## 3. Missing capabilities

**Superadmin** (none blocked by backend — all buildable in full): Create shelter, Edit shelter, Logo upload/replace/delete, Gallery add/delete.

**ShelterEmployee**: Create-shelter onboarding is buildable (not gated by the broken permission check — see §4). Edit shelter, logo, gallery, and employee management are all gated by the broken check and **cannot be built as working write controls right now**.

## 4. Known backend blockers

### 4a. Confirmed: `checkShelterEmployeePermission` still compares `position` against `"Manager"` (capital M)

`src/controllers/shelter.controller.js` line ~64:
```js
let employeeProfileQuery = ShelterEmployeeProfile.findOne({
  userId, shelterId: shelter._id, isActive: true, position: "Manager",
});
```
`ShelterEmployeeProfile.js`'s schema declares `position` with `lowercase: true` — every stored value is lowercase (`"manager"`/`"employee"`), confirmed against live data (`GET /shelter-employee-profile` returns `"position":"manager"` for every seeded manager record). A query for exact-match `"Manager"` **never matches any real document**. This means `checkShelterEmployeePermission` returns `false` for every shelterEmployee, always — not just non-managers. This is not a partial gap; it's a complete block.

**Every endpoint that calls this function is affected** (all confirmed by direct code read in this session):
1. `PATCH /shelters/:id` (updateShelter)
2. `PATCH /shelters/:id/employees` (addEmployee)
3. `DELETE /shelters/:id/employees/:employeeId` (removeEmployee)
4. `PATCH /shelters/:id/logo` (uploadLogo)
5. `PATCH /shelters/:id/logo/replace` (replaceLogo)
6. `DELETE /shelters/:id/logo` (deleteLogo)
7. `POST /shelters/:id/images` (addShelterImages)
8. `DELETE /shelters/:id/images/:publicId` (deleteShelterImage)

**Per instruction: I will not build working write controls for shelterEmployee against any of these 8 endpoints.** They stay read-only, with an honest in-UI explanation, until you approve a backend fix.

**Proposed smallest backend correction** (not applied — for your separate approval): in `checkShelterEmployeePermission`, change `position: "Manager"` to `position: "manager"`. One line, no schema/migration change, no other behavior touched. I have not made this change.

### 4b. `deleteShelterImage` reads `publicId` from the request body, not the URL

The route is `DELETE /:id/images/:publicId`, but the controller does `const { publicId } = req.body;` and never reads `req.params.publicId`. The URL segment is accepted but functionally ignored. This is not a bug to fix — it's a real requirement for the frontend: the delete-gallery-image request must include a JSON body `{ publicId }` (via axios's DELETE `data` option), in addition to the conventional URL. I'll `encodeURIComponent` the publicId in the URL for correctness/consistency even though the backend doesn't currently use it, and always send the real value in the body since that's what's actually read.

### 4c. Shelter creation by shelterEmployee is confirmed one-time / onboarding-only

`createShelter`: if `req.user.role === "shelterEmployee"`, requires an active `ShelterEmployeeProfile` and `shelterId === null` (falsy), else `404`/`409`. The newly created shelter auto-adds the creator to `employees` and sets their profile's `shelterId` — but **does not set `position` to "manager"**, so even a shelter's own founder cannot manage it afterward (same blocker as §4a). Once a shelterEmployee has any `shelterId`, `POST /shelters` permanently 409s for them — this is a strict one-time onboarding gate, not a repeatable action.

## 5. Proposed page/component architecture

**Superadmin** (all inside the existing `/shelters` page — no new route):
- `SheltersPage.tsx` — add an "Add shelter" button in the header, opening the new form modal in create mode.
- `SheltersTable.tsx` — add two new per-row icon buttons alongside the existing View/Manage-employees buttons: **Edit** (opens form modal in edit mode) and **Media** (opens the new logo/gallery modal).
- **New** `ShelterFormModal.tsx` — create + edit combined, mirroring `AnimalFormModal.tsx`'s pattern exactly (one zod schema, `toFormValues`/`toPayload` helpers, full-object resubmit on edit).
- **New** `ShelterMediaModal.tsx` — logo + gallery combined, mirroring `AnimalImagesModal.tsx`'s pattern (staged `ImageUploader`, preview grid, per-image delete, upload button).
- Reused unchanged: `ShelterQuickViewModal`, `RejectShelterDialog`, `DeleteShelterDialog`, `ManageShelterEmployeesModal`.

**ShelterEmployee:**
- `MyShelterPage.tsx` — in the existing `!shelterId` empty state, add a "Create your shelter" button opening a **new** `CreateMyShelterModal.tsx` (create-only; same form schema as the superadmin modal, wired to a shelterEmployee-safe create call — no shelter id to choose, nothing else changes).
- `MyShelterPage.tsx` and `ShelterEmployeesPage.tsx` — add a small, honest read-only notice ("Editing, logo, gallery, and team management aren't available yet — a backend permission check needs a fix first") in place of any write controls. No edit/logo/gallery/employee-management UI is built for this role this phase.
- No changes to `ShelterEmployeeOverview.tsx`, `AnimalsPage.tsx`, `AdoptionRequestsPage.tsx`, `ReviewsPage.tsx`.

## 6. Proposed API client and hook changes

**Types** (`packages/types/src/shelter.ts`): add
```ts
export interface ShelterPayload {
  name: string; email: string; phone: string;
  description?: string; address: string; city: string;
  latitude?: number; longitude?: number;
  supportedSpecies?: Species[]; capacity?: number;
  operatingHours?: { open?: string | null; close?: string | null };
  socialLinks?: { facebook?: string | null; instagram?: string | null; website?: string | null };
}
```
One shape for both create and edit (edit always resubmits the full object — same convention as `AnimalPayload`).

**Validation** (`packages/validation/src/shelter.ts`, new file): `shelterFormSchema` mirroring `createShelterValidation` (name/email/phone/address/city required; the rest optional), `ShelterFormValues` type.

**API client** (new file `packages/api-client/src/shelterWrite.ts`) — these 7 routes are genuinely shared between superadmin and shelterEmployee (identical request/response shape regardless of caller), so they don't belong in either role-specific file:
- `createShelter(client, payload)` → `POST /shelters`
- `updateShelter(client, id, payload)` → `PATCH /shelters/:id`
- `uploadShelterLogo(client, id, file)` → `PATCH /shelters/:id/logo`, FormData field `"image"`
- `replaceShelterLogo(client, id, file)` → `PATCH /shelters/:id/logo/replace`, FormData field `"image"`
- `deleteShelterLogo(client, id)` → `DELETE /shelters/:id/logo`
- `addShelterGalleryImages(client, id, files)` → `POST /shelters/:id/images`, FormData field `"images"` (multiple)
- `deleteShelterGalleryImage(client, id, publicId)` → `DELETE /shelters/:id/images/:encodedPublicId`, **with `{ data: { publicId } }`** (see §4b)

**Hooks** (new file `packages/hooks/src/shelterWrite.ts`): `createShelterWriteHooks(client)` → `useCreateShelter`, `useUpdateShelter`, `useUploadShelterLogo`, `useReplaceShelterLogo`, `useDeleteShelterLogo`, `useAddShelterGalleryImages`, `useDeleteShelterGalleryImage`. Every mutation invalidates `queryKey: ["shelters"]` (prefix match covers both `["shelters","admin",...]` and `["shelters","employee-detail",...]` caches) on success — satisfies "invalidate authoritative queries," works correctly regardless of which role/page triggered it.

**Dashboard wiring:** new `apps/dashboard/src/lib/shelterWriteHooks.ts`.

## 7. File-by-file implementation plan

1. **`packages/types/src/shelter.ts`** — add `ShelterPayload`.
2. **`packages/validation/src/shelter.ts`** (new) — `shelterFormSchema` + export from `packages/validation/src/index.ts`.
3. **`packages/api-client/src/shelterWrite.ts`** (new) — 7 functions above + export from `packages/api-client/src/index.ts`.
4. **`packages/hooks/src/shelterWrite.ts`** (new) — 7 mutation hooks + export from `packages/hooks/src/index.ts`.
5. **`apps/dashboard/src/lib/shelterWriteHooks.ts`** (new) — thin wiring.
6. **`apps/dashboard/src/pages/superadmin/components/ShelterFormModal.tsx`** (new) — create+edit form.
7. **`apps/dashboard/src/pages/superadmin/components/ShelterMediaModal.tsx`** (new) — logo+gallery management.
8. **`apps/dashboard/src/pages/superadmin/components/SheltersTable.tsx`** (modify) — add Edit + Media buttons/state/modals.
9. **`apps/dashboard/src/pages/superadmin/SheltersPage.tsx`** (modify) — add "Add shelter" button + create-mode modal state.
10. **`apps/dashboard/src/pages/shelterEmployee/components/CreateMyShelterModal.tsx`** (new) — create-only onboarding form.
11. **`apps/dashboard/src/pages/shelterEmployee/MyShelterPage.tsx`** (modify) — empty-state CTA + read-only notice.
12. **`apps/dashboard/src/pages/shelterEmployee/ShelterEmployeesPage.tsx`** (modify) — read-only notice only.

No routing changes (everything lives inside existing pages), no changes to `App.tsx`, no backend files touched.

### Verification plan (after approval + implementation)
Full workspace typecheck, dashboard + public-web production builds, lint (expected no-op), and read-only + limited-write live verification via the superadmin session already established (create → edit → logo upload/replace/delete → gallery add/delete → permanent-delete cleanup of anything I create for testing), confirming shelterEmployee's blocked endpoints still correctly 403 (proving the UI's read-only stance matches reality) without attempting to work around that.

---

## Open decisions for your review

1. **Read-only messaging wording** for the shelterEmployee side — I drafted "Editing, logo, gallery, and team management aren't available yet — a backend permission check needs a fix first." Happy to adjust tone/wording.
2. **"Strong confirmation" for permanent delete** — the existing `DeleteShelterDialog` (irreversible-action banner + explicit red button + verbatim backend errors) already exists from Phase 2. Is that sufficient, or would you like it upgraded to require typing the shelter's name before the button enables?
3. **Backend fix approval** — separate from this plan: do you want me to apply the one-line `"Manager"` → `"manager"` fix in `checkShelterEmployeePermission` now, as its own explicitly-approved change, or leave it for later and proceed with this plan's read-only scope for shelterEmployee in the meantime?

Stopping here for approval before writing any code.
