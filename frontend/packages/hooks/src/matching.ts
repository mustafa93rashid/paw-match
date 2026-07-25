import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getMatchedAnimals } from "@paw-match/api-client";

export const createMatchingHooks = (client: AxiosInstance) => {
  const useMatchedAnimals = () =>
    useQuery({
      queryKey: ["matching"],
      queryFn: () => getMatchedAnimals(client),
      retry: (failureCount, error) => {
        // 404 (no profile) and 400 (incomplete profile) won't resolve by retrying.
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 400) return false;
        return failureCount < 2;
      },
    });

  return { useMatchedAnimals };
};
