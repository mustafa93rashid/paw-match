import { useMemo, useState } from "react";
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
import { shelterEmployeeAdminHooks } from "../../../lib/shelterEmployeeAdminHooks";
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

const positionTone: Record<"manager" | "employee", BadgeTone> = {
  manager: "brand",
  employee: "neutral",
};

const positionLabel: Record<"manager" | "employee", string> = {
  manager: "Manager",
  employee: "Employee",
};

export interface UsersTableProps {
  users: AdminUser[];
}

/** Position only ever applies to shelterEmployee rows — never shown, not even empty, for any other role. */
export const UsersTable = ({ users }: UsersTableProps) => {
  const auth = useAuth();
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [viewTarget, setViewTarget] = useState<AdminUser | null>(null);

  const statusMutation = userManagementHooks.useUpdateUserStatus();
  const profilesQuery = shelterEmployeeAdminHooks.useAllShelterEmployeeProfilesAdmin();

  const positionByUserId = useMemo(() => {
    const map = new Map<string, "manager" | "employee">();
    profilesQuery.data?.forEach((profile) => {
      if (profile.userId) map.set(profile.userId._id, profile.position);
    });
    return map;
  }, [profilesQuery.data]);

  return (
    <>
      <Table>
        <TableHead>
          <TableHeaderCell>User</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>Position</TableHeaderCell>
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
                  {user.role === "shelterEmployee" && positionByUserId.has(user._id) ? (
                    <Badge tone={positionTone[positionByUserId.get(user._id)!]}>
                      {positionLabel[positionByUserId.get(user._id)!]}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
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
      <UserQuickViewModal
        user={viewTarget}
        position={viewTarget ? positionByUserId.get(viewTarget._id) : undefined}
        onClose={() => setViewTarget(null)}
      />
    </>
  );
};
