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
 * Read-only team directory for everyone, including managers — add/remove
 * lives on My Shelter's "Manage team" action instead (manager-only), not
 * duplicated here. Position/hire-date aren't shown: looking up another
 * employee's profile is superadmin-only, so only name/email/phone/role/
 * active-status (from the shelter's own `employees` populate) are available
 * here.
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
