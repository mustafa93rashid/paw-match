import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { Button, ImageUploader, Modal } from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { Animal } from "@paw-match/types";
import { animalManagementHooks } from "../../../lib/animalManagementHooks";

export interface AnimalImagesModalProps {
  animal: Animal | null;
  onClose: () => void;
}

const MAX_ANIMAL_IMAGES = 8;

/** Add/replace/set-primary/delete-one/delete-all — all confirmed reachable by any active shelterEmployee of the owning shelter (no Manager gate, unlike shelter logo/gallery). */
export const AnimalImagesModal = ({ animal, onClose }: AnimalImagesModalProps) => {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const addImagesMutation = animalManagementHooks.useAddAnimalImages();
  const setPrimaryMutation = animalManagementHooks.useSetPrimaryAnimalImage();
  const deleteImageMutation = animalManagementHooks.useDeleteAnimalImage();
  const deleteAllMutation = animalManagementHooks.useDeleteAllAnimalImages();

  const isMutating =
    addImagesMutation.isPending ||
    setPrimaryMutation.isPending ||
    deleteImageMutation.isPending ||
    deleteAllMutation.isPending;

  const handleClose = () => {
    setStagedFiles([]);
    onClose();
  };

  const handleUpload = () => {
    if (!animal || stagedFiles.length === 0) return;
    addImagesMutation.mutate(
      { id: animal._id, files: stagedFiles },
      { onSuccess: () => setStagedFiles([]) },
    );
  };

  const remainingSlots = animal ? MAX_ANIMAL_IMAGES - animal.images.length : 0;
  const mutationError =
    addImagesMutation.error ?? setPrimaryMutation.error ?? deleteImageMutation.error ?? deleteAllMutation.error;

  return (
    <Modal
      isOpen={Boolean(animal)}
      onClose={handleClose}
      title={animal ? `Manage images for ${animal.name}` : "Manage images"}
      size="lg"
    >
      {animal && (
        <div className="flex flex-col gap-6">
          {animal.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {animal.images.map((image) => (
                <div key={image._id} className="relative overflow-hidden rounded-lg border border-slate-200">
                  <img src={image.url} alt="" className="h-24 w-full object-cover" />
                  {image.isPrimary && (
                    <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">
                      <Star className="h-3 w-3" aria-hidden />
                      Primary
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-slate-900/60 p-1">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        disabled={isMutating}
                        onClick={() => setPrimaryMutation.mutate({ id: animal._id, imageId: image._id })}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-white/20"
                      >
                        Set primary
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => deleteImageMutation.mutate({ id: animal._id, imageId: image._id })}
                      className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-white/20"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {remainingSlots > 0 ? (
            <ImageUploader
              label="Choose images"
              multiple
              disabled={isMutating}
              hint={`JPEG, PNG, GIF, or WebP. Up to ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"}.`}
              files={stagedFiles}
              onFilesChange={setStagedFiles}
            />
          ) : (
            <p className="text-sm text-slate-500">
              This animal already has the maximum of {MAX_ANIMAL_IMAGES} images.
            </p>
          )}

          {mutationError && (
            <p role="alert" className="text-sm text-red-600">
              {getApiErrorMessage(mutationError)}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <Button
              variant="secondary"
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={isMutating || animal.images.length === 0}
              onClick={() => deleteAllMutation.mutate(animal._id)}
            >
              Delete all images
            </Button>
            <Button disabled={stagedFiles.length === 0} isLoading={addImagesMutation.isPending} onClick={handleUpload}>
              Upload{stagedFiles.length > 0 ? ` (${stagedFiles.length})` : ""}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
