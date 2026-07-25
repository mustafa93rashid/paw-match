import { useState } from "react";
import { AlertTriangle, Building2, Clock, Image, Mail, MapPin, Pencil, Phone, Plus, ShieldAlert, Users } from "lucide-react";
import { Badge, Button, ButtonLink, EmptyState, ErrorState, Spinner } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { ShelterEmployeeShelterDetail } from "@paw-match/types";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { shelterEmployeeShelterHooks } from "../../lib/shelterEmployeeShelterHooks";
import { paths } from "../../routes/paths";
import { ShelterFormModal } from "../../components/shelter/ShelterFormModal";
import { ShelterMediaModal } from "../../components/shelter/ShelterMediaModal";
import { ManageMyShelterTeamModal } from "./components/ManageMyShelterTeamModal";

const verificationTone: Record<ShelterEmployeeShelterDetail["verificationStatus"], BadgeTone> = {
  pending: "neutral",
  approved: "brand",
  rejected: "danger",
};

const verificationLabel: Record<ShelterEmployeeShelterDetail["verificationStatus"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/**
 * Three states, derived entirely from the caller's own ShelterEmployeeProfile
 * (never from anything the user can pass/choose):
 * - shelterId === null: one-time shelter creation/onboarding CTA.
 * - shelterId set, position !== "manager": read-only view. In practice
 *   RequireDashboardAccess already blocks a non-manager shelterEmployee from
 *   reaching this page at all, so this branch is a defensive fallback, not
 *   the normal path — stale/mid-mutation profile data should still degrade
 *   to read-only, never assume manager.
 * - shelterId set, position === "manager": full management, further gated
 *   by the shelter's own status (see isApproved/canEdit below) — a Manager
 *   whose shelter isn't approved+verified+active yet sees status information
 *   only, not the real Edit/Media/Team controls, even though some of those
 *   backend endpoints would technically still accept the call (this is a
 *   deliberately more conservative frontend rule, never a looser one).
 */
const MyShelterPage = () => {
  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile();
  const shelterId = profileQuery.data?.shelterId?._id;
  const isManager = profileQuery.data?.position === "manager";
  const shelterQuery = shelterEmployeeShelterHooks.useMyShelterDetail(shelterId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);

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
      <>
        <EmptyState
          icon={<Building2 className="h-6 w-6" aria-hidden />}
          title="No shelter has been created yet"
          description="Create your shelter to continue. This is a one-time action — once you're linked to a shelter, this option won't be available again."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Create your shelter
            </Button>
          }
        />
        <ShelterFormModal isOpen={isCreateOpen} shelter={null} onClose={() => setIsCreateOpen(false)} />
      </>
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
  const isApproved = shelter.verificationStatus === "approved" && shelter.isVerified && shelter.isActive;
  const isRejected = shelter.verificationStatus === "rejected";
  const isPending = shelter.verificationStatus === "pending";

  // Editing is how a rejected shelter gets resubmitted (any Manager edit
  // resets verificationStatus back to "pending" server-side), so it's the
  // one control allowed outside full approval. Media/team stay locked until
  // the shelter is actually approved+verified+active.
  const canEdit = isManager && (isApproved || isRejected);
  const canManageMedia = isManager && isApproved;
  const canManageTeam = isManager && isApproved;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{shelter.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={verificationTone[shelter.verificationStatus]}>{verificationLabel[shelter.verificationStatus]}</Badge>
            <Badge tone={shelter.isActive ? "accent" : "neutral"}>{shelter.isActive ? "Active" : "Inactive"}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          )}
          {canManageMedia && (
            <Button variant="secondary" onClick={() => setIsMediaOpen(true)}>
              <Image className="h-4 w-4" aria-hidden />
              Logo &amp; gallery
            </Button>
          )}
          {canManageTeam && (
            <Button variant="secondary" onClick={() => setIsTeamOpen(true)}>
              <Users className="h-4 w-4" aria-hidden />
              Manage team
            </Button>
          )}
          <ButtonLink to={paths.shelterEmployees} variant="secondary">
            <Users className="h-4 w-4" aria-hidden />
            View team
          </ButtonLink>
        </div>
      </div>

      {!isManager && (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          You have employee access. Shelter settings and team management are available only to the shelter
          manager.
        </p>
      )}

      {isManager && isPending && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <p className="text-sm text-slate-600">
            Your shelter has been submitted and is waiting for Super Admin approval. Full shelter management —
            logo, gallery, animals, and team — unlocks once it's approved.
          </p>
        </div>
      )}

      {isManager && isRejected && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
          <div>
            <p className="text-sm text-red-800">Your shelter application was rejected.</p>
            {shelter.rejectionReason && <p className="mt-1 text-sm text-red-700">Reason: {shelter.rejectionReason}</p>}
            <p className="mt-1 text-sm text-red-700">Editing your shelter's details resubmits it for review.</p>
          </div>
        </div>
      )}

      {isManager && !isPending && !isRejected && !shelter.isActive && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <p className="text-sm text-slate-600">
            Your shelter is currently inactive. Logo, gallery, animal, and team management are unavailable until
            a Super Admin reactivates it.
          </p>
        </div>
      )}

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

      {canEdit && <ShelterFormModal isOpen={isEditOpen} shelter={shelter} onClose={() => setIsEditOpen(false)} />}
      {canManageMedia && <ShelterMediaModal shelter={isMediaOpen ? shelter : null} onClose={() => setIsMediaOpen(false)} />}
      {canManageTeam && (
        <ManageMyShelterTeamModal
          isOpen={isTeamOpen}
          shelterId={shelter._id}
          shelterName={shelter.name}
          team={shelter.employees}
          onClose={() => setIsTeamOpen(false)}
        />
      )}
    </div>
  );
};

export default MyShelterPage;
