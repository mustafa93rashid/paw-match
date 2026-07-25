import { AlertTriangle, Loader2 } from "lucide-react";
import { Button, Modal } from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { AdminShelter } from "@paw-match/types";
import { shelterAdminHooks } from "../../../lib/shelterAdminHooks";

export interface DeleteShelterDialogProps {
  shelter: AdminShelter | null;
  onClose: () => void;
}

/** Irreversible action — confirm-only dialog, no form fields. The backend remains the sole authority on whether deletion is allowed (inactive + no active adoption requests); its message is shown verbatim on failure. */
export const DeleteShelterDialog = ({ shelter, onClose }: DeleteShelterDialogProps) => {
  const deleteMutation = shelterAdminHooks.useDeleteShelterPermanently();

  const handleConfirm = () => {
    if (!shelter) return;
    deleteMutation.mutate(shelter._id, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(shelter)}
      onClose={onClose}
      title={shelter ? `Delete ${shelter.name} permanently` : "Delete shelter permanently"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          {/* A plain button, not the shared Button component: Button's `variant` prop only offers
              primary/secondary/ghost (all brand-colored or neutral), and layering a red className
              override on top of `variant="primary"`'s own `bg-brand-600` risks an unpredictable
              Tailwind class-cascade conflict (two background-color utilities on one element).
              This mirrors Button's own base/size classes exactly, just red instead of brand. */}
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={handleConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Delete permanently
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
          <p className="text-sm text-red-800">
            This permanently deletes the shelter, its animals, and its adoption-request history. This action
            cannot be undone.
          </p>
        </div>
        {deleteMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(deleteMutation.error)}
          </p>
        )}
      </div>
    </Modal>
  );
};
