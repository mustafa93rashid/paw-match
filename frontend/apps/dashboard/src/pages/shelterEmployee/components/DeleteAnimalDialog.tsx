import { useState } from "react";
import { AlertTriangle, Undo2 } from "lucide-react";
import { Button, Modal } from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { Animal } from "@paw-match/types";
import { animalManagementHooks } from "../../../lib/animalManagementHooks";

export interface DeleteAnimalDialogProps {
  animal: Animal | null;
  onClose: () => void;
}

/**
 * Soft delete only. Immediately after a successful delete, offers a
 * session-only "Undo" (calls the real restore endpoint) — there is no
 * backend capability to list soft-deleted animals afterward (GET /animals
 * and GET /animals/:id both force isActive:true for a shelterEmployee), so
 * this is the only way back, and only until this component's state resets
 * (navigating away, or deleting another animal).
 */
export const DeleteAnimalDialog = ({ animal, onClose }: DeleteAnimalDialogProps) => {
  const [deletedAnimalId, setDeletedAnimalId] = useState<string | null>(null);
  const deleteMutation = animalManagementHooks.useDeleteAnimal();
  const restoreMutation = animalManagementHooks.useRestoreAnimal();

  const handleConfirm = () => {
    if (!animal) return;
    deleteMutation.mutate(animal._id, {
      onSuccess: () => {
        setDeletedAnimalId(animal._id);
        onClose();
      },
    });
  };

  const handleUndo = () => {
    if (!deletedAnimalId) return;
    restoreMutation.mutate(deletedAnimalId, { onSuccess: () => setDeletedAnimalId(null) });
  };

  return (
    <>
      <Modal
        isOpen={Boolean(animal)}
        onClose={onClose}
        title={animal ? `Delete ${animal.name}` : "Delete animal"}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="border-red-300 text-red-700 hover:bg-red-50"
              isLoading={deleteMutation.isPending}
              onClick={handleConfirm}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
            <p className="text-sm text-red-800">
              This removes the animal from every list. You'll be able to undo this immediately after,
              but not later.
            </p>
          </div>
          {deleteMutation.isError && (
            <p role="alert" className="text-sm text-red-600">
              {getApiErrorMessage(deleteMutation.error)}
            </p>
          )}
        </div>
      </Modal>

      {deletedAnimalId && (
        <div className="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-lg">
          <p className="text-sm text-slate-700">Animal deleted.</p>
          <Button variant="ghost" size="sm" isLoading={restoreMutation.isPending} onClick={handleUndo}>
            <Undo2 className="h-4 w-4" aria-hidden />
            Undo
          </Button>
        </div>
      )}
    </>
  );
};
