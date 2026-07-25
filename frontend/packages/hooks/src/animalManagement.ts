import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  addAnimalImages,
  createAnimal,
  deleteAllAnimalImages,
  deleteAnimal,
  deleteAnimalImage,
  replaceAnimalImage,
  restoreAnimal,
  setPrimaryAnimalImage,
  updateAnimal,
} from "@paw-match/api-client";
import type { AnimalPayload } from "@paw-match/types";

/** Mutation hook factory for shelter-employee/superadmin animal management, layered on top of @paw-match/hooks's existing read-only createAnimalHooks (useAnimals/useAnimal). */
export const createAnimalManagementHooks = (client: AxiosInstance) => {
  const invalidateAnimals = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["animals"] });

  const useCreateAnimal = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: AnimalPayload) => createAnimal(client, payload),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useUpdateAnimal = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: AnimalPayload }) =>
        updateAnimal(client, id, payload),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useDeleteAnimal = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => deleteAnimal(client, id),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useRestoreAnimal = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => restoreAnimal(client, id),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useAddAnimalImages = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, files }: { id: string; files: File[] }) => addAnimalImages(client, id, files),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useReplaceAnimalImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, imageId, file }: { id: string; imageId: string; file: File }) =>
        replaceAnimalImage(client, id, imageId, file),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useSetPrimaryAnimalImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
        setPrimaryAnimalImage(client, id, imageId),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useDeleteAnimalImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
        deleteAnimalImage(client, id, imageId),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  const useDeleteAllAnimalImages = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => deleteAllAnimalImages(client, id),
      onSuccess: () => invalidateAnimals(queryClient),
    });
  };

  return {
    useCreateAnimal,
    useUpdateAnimal,
    useDeleteAnimal,
    useRestoreAnimal,
    useAddAnimalImages,
    useReplaceAnimalImage,
    useSetPrimaryAnimalImage,
    useDeleteAnimalImage,
    useDeleteAllAnimalImages,
  };
};
