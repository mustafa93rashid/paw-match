import { Fragment, useMemo, useState } from "react";
import { Pencil, Search, UserMinus, UserPlus } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Spinner,
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
import { getApiErrorMessage } from "@paw-match/api-client";
import type { AdminShelter, ShelterEmployeeProfileAdminEntry } from "@paw-match/types";
import { shelterAdminHooks } from "../../../lib/shelterAdminHooks";
import { shelterEmployeeAdminHooks } from "../../../lib/shelterEmployeeAdminHooks";
import { EmployeeWorkDataDialog } from "./EmployeeWorkDataDialog";

export interface ManageShelterEmployeesModalProps {
  shelter: AdminShelter | null;
  onClose: () => void;
}

interface ActionError {
  employeeId: string;
  message: string;
}

type AssignableProfile = ShelterEmployeeProfileAdminEntry & {
  userId: NonNullable<ShelterEmployeeProfileAdminEntry["userId"]>;
};

const hasValidUser = (profile: ShelterEmployeeProfileAdminEntry): profile is AssignableProfile =>
  profile.userId !== null;

/**
 * Shelter.employees is the single source of truth for "who's currently
 * assigned" — not ShelterEmployeeProfile.shelterId, which can be stale or
 * orphaned (confirmed against real data: 7 of 10 profiles have userId: null,
 * and some still carry a shelterId that isn't reflected in any shelter's
 * employees array). "Available" employees are ShelterEmployeeProfile entries
 * with a valid (non-null) userId that isn't present in ANY shelter's
 * employees array — not just this one, and not based on their own shelterId
 * field. Orphaned profiles (userId: null) are excluded entirely from both
 * lists: there's nothing to display or safely act on.
 */
const positionTone: Record<"manager" | "employee", BadgeTone> = {
  manager: "brand",
  employee: "neutral",
};

const positionLabel: Record<"manager" | "employee", string> = {
  manager: "Manager",
  employee: "Employee",
};

export const ManageShelterEmployeesModal = ({ shelter, onClose }: ManageShelterEmployeesModalProps) => {
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<ActionError | null>(null);
  const [workDataTarget, setWorkDataTarget] = useState<AssignableProfile | null>(null);

  const sheltersQuery = shelterAdminHooks.useAdminShelters();
  const profilesQuery = shelterEmployeeAdminHooks.useAllShelterEmployeeProfilesAdmin();

  const assignMutation = shelterAdminHooks.useAssignShelterEmployee();
  const unassignMutation = shelterAdminHooks.useUnassignShelterEmployee();

  const isLoading = sheltersQuery.isLoading || profilesQuery.isLoading;
  const isError = sheltersQuery.isError || profilesQuery.isError;

  const { assignedProfiles, availableProfiles } = useMemo(() => {
    if (!shelter || !sheltersQuery.data || !profilesQuery.data) {
      return { assignedProfiles: [] as AssignableProfile[], availableProfiles: [] as AssignableProfile[] };
    }

    const assignedHereIds = new Set(shelter.employees);
    const assignedAnywhereIds = new Set(sheltersQuery.data.flatMap((s) => s.employees));

    const assigned = profilesQuery.data.filter(hasValidUser).filter((profile) => assignedHereIds.has(profile.userId._id));
    const available = profilesQuery.data.filter(hasValidUser).filter((profile) => !assignedAnywhereIds.has(profile.userId._id));

    return { assignedProfiles: assigned, availableProfiles: available };
  }, [shelter, sheltersQuery.data, profilesQuery.data]);

  const searchedAvailable = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return availableProfiles;
    return availableProfiles.filter((profile) => {
      const fullName = `${profile.userId.firstName} ${profile.userId.lastName}`.toLowerCase();
      return fullName.includes(term) || profile.userId.email.toLowerCase().includes(term);
    });
  }, [availableProfiles, search]);

  const isRowPending = (employeeId: string) =>
    (assignMutation.isPending && assignMutation.variables?.employeeId === employeeId) ||
    (unassignMutation.isPending && unassignMutation.variables?.employeeId === employeeId);

  const handleAssign = (employeeId: string) => {
    if (!shelter) return;
    setActionError(null);
    assignMutation.mutate(
      { shelterId: shelter._id, employeeId },
      { onError: (error) => setActionError({ employeeId, message: getApiErrorMessage(error) }) },
    );
  };

  const handleUnassign = (employeeId: string) => {
    if (!shelter) return;
    setActionError(null);
    unassignMutation.mutate(
      { shelterId: shelter._id, employeeId },
      { onError: (error) => setActionError({ employeeId, message: getApiErrorMessage(error) }) },
    );
  };

  const handleClose = () => {
    setSearch("");
    setActionError(null);
    setWorkDataTarget(null);
    onClose();
  };

  return (
    <Modal
      isOpen={Boolean(shelter)}
      onClose={handleClose}
      title={shelter ? `Manage employees — ${shelter.name}` : "Manage employees"}
      size="lg"
    >
      {isLoading && <Spinner label="Loading employees…" />}

      {isError && (
        <ErrorState
          title="Couldn't load employees"
          onRetry={() => {
            sheltersQuery.refetch();
            profilesQuery.refetch();
          }}
        />
      )}

      {!isLoading && !isError && shelter && (
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Current members</h3>
            {assignedProfiles.length === 0 ? (
              <EmptyState className="mt-3" title="No employees assigned yet" />
            ) : (
              <Table className="mt-3">
                <TableHead>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Position</TableHeaderCell>
                  <TableHeaderCell>Employee #</TableHeaderCell>
                  <TableHeaderCell>Hire date</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>
                    <VisuallyHidden>Actions</VisuallyHidden>
                  </TableHeaderCell>
                </TableHead>
                <TableBody>
                  {assignedProfiles.map((profile) => (
                    <Fragment key={profile._id}>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              firstName={profile.userId.firstName}
                              lastName={profile.userId.lastName}
                              profileImage={profile.userId.profileImage}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {profile.userId.firstName} {profile.userId.lastName}
                              </p>
                              <p className="truncate text-xs text-slate-500">{profile.userId.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge tone={positionTone[profile.position]}>{positionLabel[profile.position]}</Badge>
                        </TableCell>
                        <TableCell>{profile.employeeNumber ?? "—"}</TableCell>
                        <TableCell>
                          {profile.hireDate ? new Date(profile.hireDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge tone={profile.userId.isActive ? "accent" : "neutral"}>
                            {profile.userId.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="secondary" size="sm" onClick={() => setWorkDataTarget(profile)}>
                              <Pencil className="h-4 w-4" aria-hidden />
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              isLoading={isRowPending(profile.userId._id)}
                              disabled={isRowPending(profile.userId._id)}
                              onClick={() => handleUnassign(profile.userId._id)}
                            >
                              <UserMinus className="h-4 w-4" aria-hidden />
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {actionError?.employeeId === profile.userId._id && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <p role="alert" className="text-sm text-red-600">
                              {actionError.message}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Available employees</h3>
            <div className="mt-3">
              <Input
                label="Search available employees"
                hideLabel
                placeholder="Search by name or email"
                leadingIcon={<Search className="h-4 w-4" aria-hidden />}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {searchedAvailable.length === 0 ? (
              <EmptyState
                className="mt-3"
                title={
                  availableProfiles.length === 0
                    ? "No shelterEmployee accounts are available to assign"
                    : "No results match your search"
                }
              />
            ) : (
              <Table className="mt-3">
                <TableHead>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Phone</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>
                    <VisuallyHidden>Actions</VisuallyHidden>
                  </TableHeaderCell>
                </TableHead>
                <TableBody>
                  {searchedAvailable.map((profile) => (
                    <Fragment key={profile._id}>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              firstName={profile.userId.firstName}
                              lastName={profile.userId.lastName}
                              profileImage={profile.userId.profileImage}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {profile.userId.firstName} {profile.userId.lastName}
                              </p>
                              <p className="truncate text-xs text-slate-500">{profile.userId.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{profile.userId.phone ?? "—"}</TableCell>
                        <TableCell>
                          <Badge tone={profile.userId.isActive ? "accent" : "neutral"}>
                            {profile.userId.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="secondary"
                              size="sm"
                              isLoading={isRowPending(profile.userId._id)}
                              disabled={isRowPending(profile.userId._id) || !profile.userId.isActive}
                              title={!profile.userId.isActive ? "Inactive users cannot be assigned to a shelter" : undefined}
                              onClick={() => handleAssign(profile.userId._id)}
                            >
                              <UserPlus className="h-4 w-4" aria-hidden />
                              Assign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {actionError?.employeeId === profile.userId._id && (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <p role="alert" className="text-sm text-red-600">
                              {actionError.message}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      )}

      <EmployeeWorkDataDialog profile={workDataTarget} onClose={() => setWorkDataTarget(null)} />
    </Modal>
  );
};
