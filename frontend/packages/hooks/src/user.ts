import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  changePassword,
  deleteProfileImage,
  getMyProfile,
  replaceProfileImage,
  requestEmailUpdate,
  updateMyProfile,
  uploadProfileImage,
  verifyEmailUpdate,
} from "@paw-match/api-client";
import type {
  ChangePasswordPayload,
  RequestEmailUpdatePayload,
  UpdateProfilePayload,
  VerifyEmailUpdatePayload,
} from "@paw-match/types";

export const createUserAccountHooks = (client: AxiosInstance) => {
  const useMyAccountProfile = () =>
    useQuery({
      queryKey: ["user", "profile"],
      queryFn: () => getMyProfile(client),
    });

  const invalidateProfile = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["user", "profile"] });

  const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: UpdateProfilePayload) => updateMyProfile(client, payload),
      onSuccess: () => invalidateProfile(queryClient),
    });
  };

  const useUploadProfileImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (file: File) => uploadProfileImage(client, file),
      onSuccess: () => invalidateProfile(queryClient),
    });
  };

  const useReplaceProfileImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (file: File) => replaceProfileImage(client, file),
      onSuccess: () => invalidateProfile(queryClient),
    });
  };

  const useDeleteProfileImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: () => deleteProfileImage(client),
      onSuccess: () => invalidateProfile(queryClient),
    });
  };

  const useRequestEmailUpdate = () =>
    useMutation({
      mutationFn: (payload: RequestEmailUpdatePayload) => requestEmailUpdate(client, payload),
    });

  const useVerifyEmailUpdate = () =>
    useMutation({
      mutationFn: (payload: VerifyEmailUpdatePayload) => verifyEmailUpdate(client, payload),
    });

  const useChangePassword = () =>
    useMutation({
      mutationFn: (payload: ChangePasswordPayload) => changePassword(client, payload),
    });

  return {
    useMyAccountProfile,
    useUpdateProfile,
    useUploadProfileImage,
    useReplaceProfileImage,
    useDeleteProfileImage,
    useRequestEmailUpdate,
    useVerifyEmailUpdate,
    useChangePassword,
  };
};
