import { useState } from "react";
import { Search, UserMinus, UserPlus } from "lucide-react";
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
import type { ShelterTeamMemberRef } from "@paw-match/types";
import { shelterAdminHooks } from "../../../lib/shelterAdminHooks";
import { shelterEmployeeAdminHooks } from "../../../lib/shelterEmployeeAdminHooks";
import { useAuth } from "../../../lib/auth";

export interface ManageMyShelterTeamModalProps {
  isOpen: boolean;
  shelterId: string;
  shelterName: string;
  team: (ShelterTeamMemberRef | null)[];
  onClose: () => void;
}

const isRealMember = (member: ShelterTeamMemberRef | null): member is ShelterTeamMemberRef => member !== null;

const positionTone: Record<"manager" | "employee", BadgeTone> = {
  manager: "brand",
  employee: "neutral",
};

const positionLabel: Record<"manager" | "employee", string> = {
  manager: "Manager",
  employee: "Employee",
};

/**
 * Manager-only. Search backed by GET /shelter-employee-profile/available
 * (added this pass specifically so a Manager isn't reduced to pasting raw
 * account IDs) — always adds as Employee, never shows a position selector.
 * Remove is hidden entirely (not just disabled) for Manager rows and the
 * caller's own row — the backend is still authoritative and will 403 a
 * stale/bypassed request, but the UI never offers the action in the first
 * place. Always scoped to `shelterId` derived from the caller's own
 * profile — never accepts or lets the user choose a different shelter.
 */
export const ManageMyShelterTeamModal = ({
  isOpen,
  shelterId,
  shelterName,
  team,
  onClose,
}: ManageMyShelterTeamModalProps) => {
  const auth = useAuth();
  const [search, setSearch] = useState("");

  const availableQuery = shelterEmployeeAdminHooks.useAvailableShelterEmployees(search);
  const assignMutation = shelterAdminHooks.useAssignShelterEmployee();
  const unassignMutation = shelterAdminHooks.useUnassignShelterEmployee();

  const members = team.filter(isRealMember);

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  const isRowPending = (employeeId: string) =>
    (assignMutation.isPending && assignMutation.variables?.employeeId === employeeId) ||
    (unassignMutation.isPending && unassignMutation.variables?.employeeId === employeeId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Manage team — ${shelterName}`} size="lg">
      <div className="flex flex-col gap-8">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Current team</h3>
          {members.length === 0 ? (
            <EmptyState className="mt-3" title="No team members yet" />
          ) : (
            <Table className="mt-3">
              <TableHead>
                <TableHeaderCell>Member</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>
                  <VisuallyHidden>Actions</VisuallyHidden>
                </TableHeaderCell>
              </TableHead>
              <TableBody>
                {members.map((member) => {
                  const isSelf = member._id === auth.user?._id;
                  const canRemove = member.role === "shelterEmployee" && member.position !== "manager" && !isSelf;

                  return (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            firstName={member.firstName}
                            lastName={member.lastName}
                            profileImage={member.profileImage}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="truncate text-xs text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone="neutral" className="capitalize">
                            {member.role}
                          </Badge>
                          {member.position && (
                            <Badge tone={positionTone[member.position]}>{positionLabel[member.position]}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge tone={member.isActive ? "accent" : "neutral"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canRemove && (
                          <div className="flex justify-end">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isRowPending(member._id)}
                              isLoading={isRowPending(member._id)}
                              onClick={() => unassignMutation.mutate({ shelterId, employeeId: member._id })}
                            >
                              <UserMinus className="h-4 w-4" aria-hidden />
                              Remove
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {unassignMutation.isError && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {getApiErrorMessage(unassignMutation.error)}
            </p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add a team member</h3>
          <p className="mt-1 text-sm text-slate-600">
            Search unassigned shelter employee accounts. New members are always added as Employee — ask a Super
            Admin to promote someone to Manager.
          </p>
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

          {availableQuery.isLoading && (
            <div className="mt-4 flex justify-center">
              <Spinner label="Searching…" />
            </div>
          )}

          {availableQuery.isError && (
            <ErrorState
              className="mt-4"
              title="Couldn't search employees"
              onRetry={() => availableQuery.refetch()}
            />
          )}

          {availableQuery.isSuccess && availableQuery.data.length === 0 && (
            <EmptyState
              className="mt-4"
              title={search ? "No results match your search" : "No unassigned shelterEmployee accounts right now"}
            />
          )}

          {availableQuery.isSuccess && availableQuery.data.length > 0 && (
            <Table className="mt-4">
              <TableHead>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell>
                  <VisuallyHidden>Actions</VisuallyHidden>
                </TableHeaderCell>
              </TableHead>
              <TableBody>
                {availableQuery.data.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          firstName={user.firstName}
                          lastName={user.lastName}
                          profileImage={user.profileImage}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.phone ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isRowPending(user._id)}
                          isLoading={isRowPending(user._id)}
                          onClick={() => assignMutation.mutate({ shelterId, employeeId: user._id })}
                        >
                          <UserPlus className="h-4 w-4" aria-hidden />
                          Add
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {assignMutation.isError && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {getApiErrorMessage(assignMutation.error)}
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
};
