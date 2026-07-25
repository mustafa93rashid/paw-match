import { useState } from "react";
import { CheckCircle2, Eye, RotateCcw, XCircle } from "lucide-react";
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
import type { ShelterAdoptionRequest } from "@paw-match/types";
import { adoptionRequestShelterHooks } from "../../../lib/adoptionRequestShelterHooks";
import { AdoptionRequestQuickViewModal } from "./AdoptionRequestQuickViewModal";
import { RejectAdoptionRequestDialog } from "./RejectAdoptionRequestDialog";
import { CancelApprovalDialog } from "./CancelApprovalDialog";

const statusTone: Record<ShelterAdoptionRequest["status"], BadgeTone> = {
  pendingReview: "neutral",
  interview: "accent",
  homeCheck: "accent",
  approved: "brand",
  rejected: "danger",
  cancelled: "neutral",
  completed: "brand",
};

const statusLabel: Record<ShelterAdoptionRequest["status"], string> = {
  pendingReview: "Pending review",
  interview: "Interview",
  homeCheck: "Home check",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
};

export interface AdoptionRequestsTableProps {
  requests: ShelterAdoptionRequest[];
}

/** Only shows the exact next actions valid for each request's current status, per the backend's confirmed transition rules — never an action that would 400/409. */
export const AdoptionRequestsTable = ({ requests }: AdoptionRequestsTableProps) => {
  const [viewTarget, setViewTarget] = useState<ShelterAdoptionRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ShelterAdoptionRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ShelterAdoptionRequest | null>(null);

  const statusMutation = adoptionRequestShelterHooks.useUpdateAdoptionRequestStatus();
  const approveMutation = adoptionRequestShelterHooks.useApproveAdoptionRequest();
  const completeMutation = adoptionRequestShelterHooks.useCompleteAdoptionRequest();

  return (
    <>
      <Table>
        <TableHead>
          <TableHeaderCell>Adopter</TableHeaderCell>
          <TableHeaderCell>Animal</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Requested</TableHeaderCell>
          <TableHeaderCell>
            <VisuallyHidden>Actions</VisuallyHidden>
          </TableHeaderCell>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    firstName={request.adopterId?.firstName}
                    lastName={request.adopterId?.lastName}
                    profileImage={request.adopterId?.profileImage}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {request.adopterId
                        ? `${request.adopterId.firstName} ${request.adopterId.lastName}`
                        : "Unknown adopter"}
                    </p>
                    <p className="truncate text-xs text-slate-500">{request.adopterId?.email ?? "—"}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium text-slate-900">{request.animalId.name}</p>
                <p className="text-xs capitalize text-slate-500">{request.animalId.species}</p>
              </TableCell>
              <TableCell>
                <Badge tone={statusTone[request.status]}>{statusLabel[request.status]}</Badge>
              </TableCell>
              <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1.5">
                  {request.status === "pendingReview" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={statusMutation.isPending && statusMutation.variables?.id === request._id}
                        onClick={() => statusMutation.mutate({ id: request._id, status: "interview" })}
                      >
                        Move to interview
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setRejectTarget(request)}>
                        <XCircle className="h-4 w-4" aria-hidden />
                        Reject
                      </Button>
                    </>
                  )}

                  {request.status === "interview" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={statusMutation.isPending && statusMutation.variables?.id === request._id}
                        onClick={() => statusMutation.mutate({ id: request._id, status: "homeCheck" })}
                      >
                        Move to home check
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setRejectTarget(request)}>
                        <XCircle className="h-4 w-4" aria-hidden />
                        Reject
                      </Button>
                    </>
                  )}

                  {request.status === "homeCheck" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={approveMutation.isPending && approveMutation.variables === request._id}
                        onClick={() => approveMutation.mutate(request._id)}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Approve
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setRejectTarget(request)}>
                        <XCircle className="h-4 w-4" aria-hidden />
                        Reject
                      </Button>
                    </>
                  )}

                  {request.status === "approved" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={completeMutation.isPending && completeMutation.variables === request._id}
                        onClick={() => completeMutation.mutate(request._id)}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Complete
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setCancelTarget(request)}>
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Cancel approval
                      </Button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setViewTarget(request)}
                    aria-label={
                      request.adopterId
                        ? `View request from ${request.adopterId.firstName} ${request.adopterId.lastName}`
                        : "View request from unknown adopter"
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AdoptionRequestQuickViewModal request={viewTarget} onClose={() => setViewTarget(null)} />
      <RejectAdoptionRequestDialog request={rejectTarget} onClose={() => setRejectTarget(null)} />
      <CancelApprovalDialog request={cancelTarget} onClose={() => setCancelTarget(null)} />
    </>
  );
};
