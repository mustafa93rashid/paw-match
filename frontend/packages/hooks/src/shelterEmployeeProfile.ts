import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getMyShelterEmployeeProfile } from "@paw-match/api-client";

export const createShelterEmployeeProfileHooks = (client: AxiosInstance) => {
  /** Pass `enabled: false` when the caller isn't a shelterEmployee (e.g. the shared Reviews page). */
  const useMyShelterEmployeeProfile = (options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: ["shelterEmployeeProfile", "me"],
      queryFn: () => getMyShelterEmployeeProfile(client),
      enabled: options.enabled ?? true,
    });

  return { useMyShelterEmployeeProfile };
};
