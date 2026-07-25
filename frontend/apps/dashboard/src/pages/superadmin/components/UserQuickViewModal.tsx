import { Badge, Modal, UserAvatar } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { AdminUser } from "@paw-match/types";

export interface UserQuickViewModalProps {
  user: AdminUser | null;
  /** From a separate ShelterEmployeeProfile document — only ever meaningful when user.role === "shelterEmployee". */
  position?: "manager" | "employee";
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

const positionTone: Record<"manager" | "employee", BadgeTone> = {
  manager: "brand",
  employee: "neutral",
};

const positionLabel: Record<"manager" | "employee", string> = {
  manager: "Manager",
  employee: "Employee",
};

/** Read-only preview built entirely from data already present in the admin users list response (plus the already-cached shelter-employee-profiles list for position) — no additional API calls, no new route. */
export const UserQuickViewModal = ({ user, position, onClose }: UserQuickViewModalProps) => (
  <Modal isOpen={Boolean(user)} onClose={onClose} title={user ? `${user.firstName} ${user.lastName}` : "User details"}>
    {user && (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar firstName={user.firstName} lastName={user.lastName} profileImage={user.profileImage} />
          <div className="flex flex-wrap gap-2">
            <Badge tone={roleTone[user.role]}>{roleLabel[user.role]}</Badge>
            {user.role === "shelterEmployee" && position && (
              <Badge tone={positionTone[position]}>{positionLabel[position]}</Badge>
            )}
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
