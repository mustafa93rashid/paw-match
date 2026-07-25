# Data Integrity Findings

Living log of data-consistency issues discovered in the live database during
Dashboard development, kept separate from any single phase's plan/spec since
these are backend/data facts that outlive any one feature. **Do not clean up,
delete, or otherwise alter the underlying records without a separate,
explicitly-approved data-integrity task.** No backend code has been modified
to address any finding below.

## Orphaned `ShelterEmployeeProfile` records (`userId === null`)

Discovered: 2026-07-24, during Shelter Employee Assignment (Super Admin
Dashboard) implementation, via a read-only `GET /shelter-employee-profile`
call.

**7 of 10** `ShelterEmployeeProfile` documents currently have `userId: null`
— the `User` document the profile's `userId` ref points to no longer exists
(deleted), leaving the profile behind as an orphan. This is the same class
of dangling-populate-ref issue found repeatedly elsewhere in this project
(`AdminShelter.createdBy`, `ShelterTeamMemberRef` entries, `VetAppointment
.adopterId`/`vetId`, `Review.adopterId`) — Mongoose's `populate()` silently
resolves a dangling reference to `null` rather than erroring or omitting the
field.

Of the 7 orphaned profiles:
- 3 are otherwise harmless: `shelterId: null` (never assigned to any
  shelter), `position: "employee"`, no employee number/hire date.
- **4 carry a stale `shelterId`**, referencing either Baghdad Happy Paws
  Shelter or Diyala Animal Rescue Center, with seeded-looking position data
  (`employeeNumber` values like `BGD-MGR-001`, `DYL-MGR-001`, `BGD-EMP-001`,
  `DYL-EMP-001`; `position` values `"manager"`/`"employee"` — note the
  inconsistent casing already present in seed data, separate from this
  finding). **None of these 4 user IDs appear in either shelter's actual
  `employees` array.**

### Why the stale `shelterId` matters

`Shelter.employees` (the array `PATCH /shelters/:id/employees` and `DELETE
/shelters/:id/employees/:employeeId` actually read and mutate) and
`ShelterEmployeeProfile.shelterId` (a separate field, set/cleared by those
same two endpoints as a side effect) are **not guaranteed consistent** for
these 4 records. If a UI derived "currently assigned" from
`ShelterEmployeeProfile.shelterId` alone, these 4 would appear as assigned
shelter members with no way to actually remove them — there's no real
`userId` to send as `employeeId`, and even a stale ID would 404 from
`removeEmployee` (which checks membership in `shelter.employees` first).

**Resolution applied (Super Admin → Manage Employees feature, 2026-07-24):**
`Shelter.employees` is treated as the sole source of truth for assignment
state. `ShelterEmployeeProfile` is used only to enrich a valid, resolvable
employee record (name/email/phone/active status) and to identify available
users (valid `userId`, not present in any shelter's `employees` array).
Orphaned profiles and any `shelter.employees` id with no matching valid
profile are hidden from both the "current members" and "available
employees" UI entirely — never exposed as assignable or removable.

## Mutation responses silently drop unresolved references

Discovered: 2026-07-24, same session, while live-testing `PATCH
/shelters/:id/employees` and `DELETE /shelters/:id/employees/:employeeId`
against a disposable test account.

Both endpoints' own response body populates `data.employees` via
`.populate("employees", "firstName lastName email phone role profileImage
isActive")`. When the shelter's `employees` array contains an id that
`populate` cannot resolve (dangling ref), that entry is **silently dropped
from the array** in the response body — the array comes back shorter than
the source array, rather than containing a `null` placeholder (the more
common Mongoose behavior seen elsewhere in this project, e.g.
`ShelterTeamMemberRef`). Observed directly: a shelter with 3 real employee
ids returned only 1 in a mutation's response body, while an immediate,
separate `GET /shelters/admin/all` (unpopulated) call correctly showed all 3
raw ids.

**Resolution applied:** the frontend's `assignShelterEmployee` /
`unassignShelterEmployee` functions do not read or use the mutation
response body at all. The UI relies exclusively on invalidating and
refetching the admin shelters and shelter-employee-profiles queries
afterward. Mutation responses should not be treated as authoritative
anywhere in this codebase going forward — this is a general principle, not
specific to this one pair of endpoints.

## Status

All items above are **documented only** — the underlying orphaned records,
stale `shelterId` values, and the mutation-response population gap all
still exist in the database/backend as of 2026-07-24. Any cleanup (deleting
orphaned profiles, backfilling/clearing stale `shelterId`s, changing what
`addEmployee`/`removeEmployee` populate in their responses) requires a
separate, explicitly-approved data-integrity task.
