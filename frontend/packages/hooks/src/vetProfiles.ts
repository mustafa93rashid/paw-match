import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getVetById, getVets, type VetsParams } from "@paw-match/api-client";

export const createVetProfileHooks = (client: AxiosInstance) => {
  const useVets = (filters: VetsParams = {}, options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: ["vets", filters],
      queryFn: () => getVets(client, filters),
      enabled: options.enabled ?? true,
    });

  const useVet = (userId: string | undefined, options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: ["vets", "detail", userId],
      queryFn: () => getVetById(client, userId as string),
      enabled: Boolean(userId) && (options.enabled ?? true),
    });

  return { useVets, useVet };
};
