import { CheckCircle2 } from "lucide-react";
import { Button, Modal } from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { StaffApplication } from "@paw-match/types";
import { staffApplicationHooks } from "../../../lib/staffApplicationHooks";

export interface ApproveApplicationDialogProps {
  application: StaffApplication | null;
  onClose: () => void;
}

const summary: Record<StaffApplication["applicationType"], string> = {
  shelterManager:
    "This creates a shelterEmployee account with the Manager position, creates and links the proposed shelter, and sends an account-activation email. The applicant sets their own password before they can sign in.",
  vet: "This creates a vet account and the corresponding veterinary profile, then sends an account-activation email. The applicant sets their own password before they can sign in.",
};

/** Confirmation gate before the irreversible account-creation transaction in staffApplication.controller.js's approve(). */
export const ApproveApplicationDialog = ({ application, onClose }: ApproveApplicationDialogProps) => {
  const approveMutation = staffApplicationHooks.useApproveStaffApplication();

  const handleConfirm = () => {
    if (!application) return;
    approveMutation.mutate(application._id, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(application)}
      onClose={onClose}
      title={application ? `Approve ${application.firstName} ${application.lastName}'s application?` : "Approve application"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={approveMutation.isPending}>
            Cancel
          </Button>
          <Button isLoading={approveMutation.isPending} onClick={handleConfirm}>
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Approve application
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {application && (
          <p className="text-sm text-slate-600">{summary[application.applicationType]}</p>
        )}

        {approveMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(approveMutation.error)}
          </p>
        )}
      </div>
    </Modal>
  );
};
