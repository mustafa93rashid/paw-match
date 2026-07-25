import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  addShelterGalleryImages,
  createShelter,
  deleteShelterGalleryImage,
  deleteShelterLogo,
  replaceShelterLogo,
  updateShelter,
  uploadShelterLogo,
} from "@paw-match/api-client";
import type { ShelterPayload } from "@paw-match/types";

/**
 * Shared create/update/logo/gallery mutations — usable by both superadmin
 * and a shelterEmployee manager. Every mutation invalidates the bare
 * ["shelters"] prefix, covering both the admin list cache
 * (["shelters","admin",filters]) and a shelterEmployee's own shelter detail
 * cache (["shelters","employee-detail",id]) regardless of which role
 * triggered the change.
 */
export const createShelterWriteHooks = (client: AxiosInstance) => {
  const invalidateShelters = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["shelters"] });

  const useCreateShelter = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: ShelterPayload) => createShelter(client, payload),
      onSuccess: () => {
        invalidateShelters(queryClient);
        // A shelterEmployee caller gets auto-linked to the new shelter
        // server-side — their own profile's shelterId just changed.
        // Harmless no-op for a superadmin caller (no such query active).
        queryClient.invalidateQueries({ queryKey: ["shelterEmployeeProfile", "me"] });
      },
    });
  };

  const useUpdateShelter = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: ShelterPayload }) => updateShelter(client, id, payload),
      onSuccess: () => invalidateShelters(queryClient),
    });
  };

  const useUploadShelterLogo = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, file }: { id: string; file: File }) => uploadShelterLogo(client, id, file),
      onSuccess: () => invalidateShelters(queryClient),
    });
  };

  const useReplaceShelterLogo = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, file }: { id: string; file: File }) => replaceShelterLogo(client, id, file),
      onSuccess: () => invalidateShelters(queryClient),
    });
  };

  const useDeleteShelterLogo = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => deleteShelterLogo(client, id),
      onSuccess: () => invalidateShelters(queryClient),
    });
  };

  const useAddShelterGalleryImages = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, files }: { id: string; files: File[] }) => addShelterGalleryImages(client, id, files),
      onSuccess: () => invalidateShelters(queryClient),
    });
  };

  const useDeleteShelterGalleryImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, publicId }: { id: string; publicId: string }) =>
        deleteShelterGalleryImage(client, id, publicId),
      onSuccess: () => invalidateShelters(queryClient),
    });
  };

  return {
    useCreateShelter,
    useUpdateShelter,
    useUploadShelterLogo,
    useReplaceShelterLogo,
    useDeleteShelterLogo,
    useAddShelterGalleryImages,
    useDeleteShelterGalleryImage,
  };
};
