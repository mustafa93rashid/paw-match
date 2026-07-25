import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, Trash2, Upload, UserRound } from "lucide-react";
import { Button } from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import { validateProfileImageFile } from "@paw-match/utilities";
import type { AuthUser } from "@paw-match/types";
import { useAuth } from "../../../lib/auth";
import { userAccountHooks } from "../../../lib/userAccountHooks";

export interface ProfileImageManagerProps {
  profile: AuthUser;
}

export const ProfileImageManager = ({ profile }: ProfileImageManagerProps) => {
  const auth = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const uploadMutation = userAccountHooks.useUploadProfileImage();
  const replaceMutation = userAccountHooks.useReplaceProfileImage();
  const deleteMutation = userAccountHooks.useDeleteProfileImage();

  const hasExistingImage = Boolean(profile.profileImage);
  const isMutating = uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending;

  // Revoke the local object URL whenever it's replaced or the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setActionError(null);
    setSuccessMessage(null);

    if (!file) return;

    const validationError = validateProfileImageFile(file);
    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    setFileError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
  };

  const handleSave = () => {
    if (!selectedFile) return;

    const mutation = hasExistingImage ? replaceMutation : uploadMutation;

    mutation.mutate(selectedFile, {
      onSuccess: (updatedUser) => {
        auth.updateUser(updatedUser);
        setSuccessMessage(hasExistingImage ? "Profile image replaced." : "Profile image uploaded.");
        resetSelection();
      },
      onError: (error) => {
        setActionError(getApiErrorMessage(error, "Could not save your profile image."));
      },
    });
  };

  const handleDelete = () => {
    setActionError(null);
    setSuccessMessage(null);

    deleteMutation.mutate(undefined, {
      onSuccess: (updatedUser) => {
        auth.updateUser(updatedUser);
        setSuccessMessage("Profile image deleted.");
        setIsConfirmingDelete(false);
      },
      onError: (error) => {
        setActionError(getApiErrorMessage(error, "Could not delete your profile image."));
        setIsConfirmingDelete(false);
      },
    });
  };

  const displayedImageUrl = previewUrl ?? profile.profileImage?.url ?? null;

  return (
    <div className="flex flex-col gap-5">
      {successMessage && (
        <p role="status" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          {successMessage}
        </p>
      )}

      {actionError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="flex items-center gap-5">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-400">
          {displayedImageUrl ? (
            <img src={displayedImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-10 w-10" aria-hidden />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Upload className="h-4 w-4" aria-hidden />
            Choose image
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isMutating}
            />
          </label>
          <p className="text-xs text-slate-500">JPEG, PNG, GIF, or WebP. Max 5MB.</p>
          {fileError && (
            <p role="alert" className="text-sm text-red-600">
              {fileError}
            </p>
          )}
        </div>
      </div>

      {selectedFile && !fileError && (
        <div className="flex flex-wrap gap-3">
          <Button size="sm" isLoading={isMutating} onClick={handleSave}>
            {hasExistingImage ? "Replace image" : "Upload image"}
          </Button>
          <Button size="sm" variant="secondary" disabled={isMutating} onClick={resetSelection}>
            Cancel
          </Button>
        </div>
      )}

      {hasExistingImage && !selectedFile && (
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4">
          {!isConfirmingDelete ? (
            <Button
              size="sm"
              variant="secondary"
              className="self-start"
              disabled={isMutating}
              onClick={() => setIsConfirmingDelete(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete profile image
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
              <p className="text-sm text-red-700">Delete your profile image? This can't be undone.</p>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={deleteMutation.isPending}
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  isLoading={deleteMutation.isPending}
                  onClick={handleDelete}
                >
                  Confirm delete
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
