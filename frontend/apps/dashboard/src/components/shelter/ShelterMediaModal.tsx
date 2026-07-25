import { useState } from "react";
import { Building2, Trash2 } from "lucide-react";
import { Button, ImageUploader, Modal } from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { AdminShelter } from "@paw-match/types";
import { shelterWriteHooks } from "../../lib/shelterWriteHooks";

/** Minimal shape both AdminShelter and ShelterEmployeeShelterDetail satisfy. */
type ShelterMediaSource = Pick<AdminShelter, "_id" | "name" | "logo" | "images">;

export interface ShelterMediaModalProps {
  shelter: ShelterMediaSource | null;
  onClose: () => void;
}

const MAX_SHELTER_IMAGES = 8;

/**
 * Logo + gallery management, reused by both the Super Admin Shelters page
 * and a shelterEmployee manager's My Shelter page (same shared endpoints as
 * ShelterFormModal). Mirrors AnimalImagesModal's staged-upload pattern.
 */
export const ShelterMediaModal = ({ shelter, onClose }: ShelterMediaModalProps) => {
  const [stagedLogo, setStagedLogo] = useState<File[]>([]);
  const [stagedGalleryFiles, setStagedGalleryFiles] = useState<File[]>([]);

  const uploadLogoMutation = shelterWriteHooks.useUploadShelterLogo();
  const replaceLogoMutation = shelterWriteHooks.useReplaceShelterLogo();
  const deleteLogoMutation = shelterWriteHooks.useDeleteShelterLogo();
  const addGalleryMutation = shelterWriteHooks.useAddShelterGalleryImages();
  const deleteGalleryMutation = shelterWriteHooks.useDeleteShelterGalleryImage();

  const isMutating =
    uploadLogoMutation.isPending ||
    replaceLogoMutation.isPending ||
    deleteLogoMutation.isPending ||
    addGalleryMutation.isPending ||
    deleteGalleryMutation.isPending;

  const mutationError =
    uploadLogoMutation.error ??
    replaceLogoMutation.error ??
    deleteLogoMutation.error ??
    addGalleryMutation.error ??
    deleteGalleryMutation.error;

  const handleClose = () => {
    setStagedLogo([]);
    setStagedGalleryFiles([]);
    onClose();
  };

  const handleLogoUpload = () => {
    if (!shelter || stagedLogo.length === 0) return;
    const file = stagedLogo[0];
    if (!file) return;

    if (shelter.logo) {
      replaceLogoMutation.mutate({ id: shelter._id, file }, { onSuccess: () => setStagedLogo([]) });
    } else {
      uploadLogoMutation.mutate({ id: shelter._id, file }, { onSuccess: () => setStagedLogo([]) });
    }
  };

  const handleGalleryUpload = () => {
    if (!shelter || stagedGalleryFiles.length === 0) return;
    addGalleryMutation.mutate(
      { id: shelter._id, files: stagedGalleryFiles },
      { onSuccess: () => setStagedGalleryFiles([]) },
    );
  };

  const remainingSlots = shelter ? MAX_SHELTER_IMAGES - shelter.images.length : 0;
  const canDeleteGalleryImage = shelter ? shelter.images.length > 1 : false;

  return (
    <Modal
      isOpen={Boolean(shelter)}
      onClose={handleClose}
      title={shelter ? `Manage media for ${shelter.name}` : "Manage media"}
      size="lg"
    >
      {shelter && (
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Logo</h3>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                {shelter.logo ? (
                  <img src={shelter.logo.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-slate-300" aria-hidden />
                )}
              </div>
              {shelter.logo && (
                <Button
                  variant="secondary"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  disabled={isMutating}
                  onClick={() => deleteLogoMutation.mutate(shelter._id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete logo
                </Button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <ImageUploader
                label="Choose logo image"
                disabled={isMutating}
                hint="JPEG, PNG, GIF, or WebP."
                files={stagedLogo}
                onFilesChange={(files) => setStagedLogo(files.slice(-1))}
                className="flex-1"
              />
              <Button disabled={stagedLogo.length === 0} isLoading={uploadLogoMutation.isPending || replaceLogoMutation.isPending} onClick={handleLogoUpload}>
                {shelter.logo ? "Replace logo" : "Upload logo"}
              </Button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Gallery</h3>

            {shelter.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {shelter.images.map((image) => (
                  <div key={image.publicId} className="relative overflow-hidden rounded-lg border border-slate-200">
                    <img src={image.url} alt="" className="h-24 w-full object-cover" />
                    <button
                      type="button"
                      disabled={isMutating || !canDeleteGalleryImage}
                      title={!canDeleteGalleryImage ? "At least one gallery image must remain" : undefined}
                      onClick={() => deleteGalleryMutation.mutate({ id: shelter._id, publicId: image.publicId })}
                      className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-slate-900/60 p-1 text-[10px] font-medium text-white hover:bg-slate-900/80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {remainingSlots > 0 ? (
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <ImageUploader
                  label="Choose gallery images"
                  multiple
                  disabled={isMutating}
                  hint={`JPEG, PNG, GIF, or WebP. Up to ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"}.`}
                  files={stagedGalleryFiles}
                  onFilesChange={setStagedGalleryFiles}
                  className="flex-1"
                />
                <Button disabled={stagedGalleryFiles.length === 0} isLoading={addGalleryMutation.isPending} onClick={handleGalleryUpload}>
                  Upload{stagedGalleryFiles.length > 0 ? ` (${stagedGalleryFiles.length})` : ""}
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                This shelter already has the maximum of {MAX_SHELTER_IMAGES} gallery images.
              </p>
            )}
          </section>

          {mutationError && (
            <p role="alert" className="text-sm text-red-600">
              {getApiErrorMessage(mutationError)}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};
