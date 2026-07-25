import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { createUser, getAllUsers, updateUserRole, updateUserStatus } from "@paw-match/api-client";
import type { CreateUserPayload, UserRole } from "@paw-match/types";

/**
 * Query hook factory for Super-Admin user management. GET /user has no
 * query params at all, so search/filter/sort/pagination all happen
 * client-side against this cached list (see
 * apps/dashboard/src/pages/superadmin/UsersPage.tsx).
 */
export const createUserManagementHooks = (client: AxiosInstance) => {
  const adminUsersKey = ["users", "admin"] as const;

  const useAdminUsers = () =>
    useQuery({
      queryKey: adminUsersKey,
      queryFn: () => getAllUsers(client),
    });

  const invalidateAdminUsers = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: adminUsersKey });

  const useCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: CreateUserPayload) => createUser(client, payload),
      onSuccess: () => invalidateAdminUsers(queryClient),
    });
  };

  const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, role }: { id: string; role: Exclude<UserRole, "superadmin"> }) =>
        updateUserRole(client, id, role),
      onSuccess: () => invalidateAdminUsers(queryClient),
    });
  };

  const useUpdateUserStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
        updateUserStatus(client, id, isActive),
      onSuccess: () => invalidateAdminUsers(queryClient),
    });
  };

  return {
    useAdminUsers,
    useCreateUser,
    useUpdateUserRole,
    useUpdateUserStatus,
  };
};
