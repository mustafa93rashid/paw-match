import { useState } from "react";
import { CheckCircle2, Eye, Mail, Pencil, XCircle } from "lucide-react";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  VisuallyHidden,
} from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { StaffApplication } from "@paw-match/types";
import { staffApplicationHooks } from "../../../lib/staffApplicationHooks";
import { ApproveApplicationDialog } from "./ApproveApplicationDialog";
import { RejectApplicationDialog } from "./RejectApplicationDialog";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { EditApplicationDialog } from "./EditApplicationDialog";

const statusTone: Record<StaffApplication["status"], BadgeTone> = {
  pendingVerification: "neutral",
  pending: "brand",
  approved: "accent",
  rejected: "danger",
};

const statusLabel: Record<StaffApplication["status"], string> = {
  pendingVerification: "Pending verification",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const applicationTypeLabel: Record<StaffApplication["applicationType"], string> = {
  shelterManager: "Shelter Manager",
  vet: "Veterinarian",
};

export interface ApplicationsTableProps {
  applications: StaffApplication[];
}

export const ApplicationsTable = ({ applications }: ApplicationsTableProps) => {
  const [approveTarget, setApproveTarget] = useState<StaffApplication | null>(null);
  const [rejectTarget, setRejectTarget] = useState<StaffApplication | null>(null);
  const [viewTarget, setViewTarget] = useState<StaffApplication | null>(null);
  const [editTarget, setEditTarget] = useState<StaffApplication | null>(null);

  const resendActivationMutation = staffApplicationHooks.useResendActivation();

  return (
    <>
      <Table>
        <TableHead>
          <TableHeaderCell>Applicant</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Email verified</TableHeaderCell>
          <TableHeaderCell>Activation</TableHeaderCell>
          <TableHeaderCell>Submitted</TableHeaderCell>
          <TableHeaderCell>
            <VisuallyHidden>Actions</VisuallyHidden>
          </TableHeaderCell>
        </TableHead>
        <TableBody>
          {applications.map((application) => {
            const canApprove = application.status === "pending";
            const canReject = application.status === "pendingVerification" || application.status === "pending";
            const canEdit = application.status === "pending";
            const canResendActivation =
              application.status === "approved" &&
              application.approvedUserId &&
              !application.approvedUserId.isAccountActivated;

            return (
              <TableRow key={application._id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {application.firstName} {application.lastName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{application.email}</p>
                  </div>
                </TableCell>
                <TableCell>{applicationTypeLabel[application.applicationType]}</TableCell>
                <TableCell>
                  <Badge tone={statusTone[application.status]}>{statusLabel[application.status]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge tone={application.emailVerified ? "accent" : "neutral"}>
                    {application.emailVerified ? "Verified" : "Verification pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {application.status === "approved" && application.approvedUserId ? (
                    <Badge tone={application.approvedUserId.isAccountActivated ? "accent" : "neutral"}>
                      {application.approvedUserId.isAccountActivated ? "Activated" : "Activation pending"}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell>{new Date(application.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    {canApprove && (
                      <Button variant="secondary" size="sm" onClick={() => setApproveTarget(application)}>
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Approve
                      </Button>
                    )}
                    {canReject && (
                      <Button variant="secondary" size="sm" onClick={() => setRejectTarget(application)}>
                        <XCircle className="h-4 w-4" aria-hidden />
                        Reject
                      </Button>
                    )}
                    {canResendActivation && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={
                          resendActivationMutation.isPending &&
                          resendActivationMutation.variables === application.email
                        }
                        onClick={() => resendActivationMutation.mutate(application.email)}
                      >
                        <Mail className="h-4 w-4" aria-hidden />
                        Resend activation
                      </Button>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditTarget(application)}
                        aria-label={`Edit ${application.firstName} ${application.lastName}'s application`}
                        title="Edit application"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setViewTarget(application)}
                      aria-label={`View ${application.firstName} ${application.lastName}`}
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

      <ApproveApplicationDialog application={approveTarget} onClose={() => setApproveTarget(null)} />
      <RejectApplicationDialog application={rejectTarget} onClose={() => setRejectTarget(null)} />
      <ApplicationDetailModal application={viewTarget} onClose={() => setViewTarget(null)} />
      <EditApplicationDialog application={editTarget} onClose={() => setEditTarget(null)} />
    </>
  );
};
