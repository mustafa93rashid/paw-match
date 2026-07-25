import { useState } from "react";
import { CheckCircle2, Eye, Image, PauseCircle, Pencil, PlayCircle as ActivateIcon, Trash2, Users, XCircle } from "lucide-react";
import {
  Badge,
  Button,
  RowActionsMenu,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  VisuallyHidden,
} from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { AdminShelter } from "@paw-match/types";
import { shelterAdminHooks } from "../../../lib/shelterAdminHooks";
import { ShelterFormModal } from "../../../components/shelter/ShelterFormModal";
import { ShelterMediaModal } from "../../../components/shelter/ShelterMediaModal";
import { RejectShelterDialog } from "./RejectShelterDialog";
import { DeleteShelterDialog } from "./DeleteShelterDialog";
import { ShelterQuickViewModal } from "./ShelterQuickViewModal";
import { ManageShelterEmployeesModal } from "./ManageShelterEmployeesModal";

const verificationTone: Record<AdminShelter["verificationStatus"], BadgeTone> = {
  pending: "neutral",
  approved: "brand",
  rejected: "danger",
};

const verificationLabel: Record<AdminShelter["verificationStatus"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export interface SheltersTableProps {
  shelters: AdminShelter[];
}

export const SheltersTable = ({ shelters }: SheltersTableProps) => {
  const [rejectTarget, setRejectTarget] = useState<AdminShelter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminShelter | null>(null);
  const [viewTarget, setViewTarget] = useState<AdminShelter | null>(null);
  const [manageEmployeesTarget, setManageEmployeesTarget] = useState<AdminShelter | null>(null);
  const [editTarget, setEditTarget] = useState<AdminShelter | null>(null);
  const [mediaTarget, setMediaTarget] = useState<AdminShelter | null>(null);

  const approveMutation = shelterAdminHooks.useApproveShelter();
  const toggleStatusMutation = shelterAdminHooks.useToggleShelterStatus();

  return (
    <>
      <Table>
        <TableHead>
          <TableHeaderCell>Shelter</TableHeaderCell>
          <TableHeaderCell>City</TableHeaderCell>
          <TableHeaderCell>Verification</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Registered</TableHeaderCell>
          <TableHeaderCell>
            <VisuallyHidden>Actions</VisuallyHidden>
          </TableHeaderCell>
        </TableHead>
        <TableBody>
          {shelters.map((shelter) => {
            const canActivate = shelter.isActive || shelter.verificationStatus === "approved";

            return (
              <TableRow key={shelter._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {shelter.logo ? (
                      <img src={shelter.logo.url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {shelter.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{shelter.name}</p>
                      <p className="truncate text-xs text-slate-500">{shelter.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{shelter.city}</TableCell>
                <TableCell>
                  <Badge tone={verificationTone[shelter.verificationStatus]}>
                    {verificationLabel[shelter.verificationStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge tone={shelter.isActive ? "accent" : "neutral"}>
                    {shelter.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(shelter.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    {shelter.verificationStatus === "pending" && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={approveMutation.isPending && approveMutation.variables === shelter._id}
                          onClick={() => approveMutation.mutate(shelter._id)}
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Approve
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setRejectTarget(shelter)}>
                          <XCircle className="h-4 w-4" aria-hidden />
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!canActivate}
                      title={!canActivate ? "Approve the shelter before activating it" : undefined}
                      isLoading={toggleStatusMutation.isPending && toggleStatusMutation.variables === shelter._id}
                      onClick={() => toggleStatusMutation.mutate(shelter._id)}
                    >
                      {shelter.isActive ? (
                        <>
                          <PauseCircle className="h-4 w-4" aria-hidden />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ActivateIcon className="h-4 w-4" aria-hidden />
                          Activate
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setViewTarget(shelter)}
                      aria-label={`View ${shelter.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                    </button>

                    <button
                      type="button"
                      onClick={() => setManageEmployeesTarget(shelter)}
                      aria-label={`Manage employees for ${shelter.name}`}
                      title="Manage employees"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Users className="h-4 w-4" aria-hidden />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditTarget(shelter)}
                      aria-label={`Edit ${shelter.name}`}
                      title="Edit shelter"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>

                    <button
                      type="button"
                      onClick={() => setMediaTarget(shelter)}
                      aria-label={`Manage media for ${shelter.name}`}
                      title="Manage logo & gallery"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Image className="h-4 w-4" aria-hidden />
                    </button>

                    <RowActionsMenu
                      label={`More actions for ${shelter.name}`}
                      actions={[
                        {
                          label: "Delete permanently",
                          icon: Trash2,
                          tone: "danger",
                          disabled: shelter.isActive,
                          disabledReason: "Deactivate the shelter before deleting it permanently",
                          onClick: () => setDeleteTarget(shelter),
                        },
                      ]}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <RejectShelterDialog shelter={rejectTarget} onClose={() => setRejectTarget(null)} />
      <DeleteShelterDialog shelter={deleteTarget} onClose={() => setDeleteTarget(null)} />
      <ShelterQuickViewModal shelter={viewTarget} onClose={() => setViewTarget(null)} />
      <ManageShelterEmployeesModal shelter={manageEmployeesTarget} onClose={() => setManageEmployeesTarget(null)} />
      <ShelterFormModal isOpen={Boolean(editTarget)} shelter={editTarget} onClose={() => setEditTarget(null)} />
      <ShelterMediaModal shelter={mediaTarget} onClose={() => setMediaTarget(null)} />
    </>
  );
};
