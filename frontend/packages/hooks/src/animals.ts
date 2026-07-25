import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getAnimalById, getAnimals, type AnimalsParams } from "@paw-match/api-client";

export const createAnimalHooks = (client: AxiosInstance) => {
  /** Pass `enabled: false` while the caller isn't authenticated yet. */
  const useAnimals = (filters: AnimalsParams = {}, options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: ["animals", filters],
      queryFn: () => getAnimals(client, filters),
      enabled: options.enabled ?? true,
    });

  const useAnimal = (id: string | undefined, options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: ["animals", "detail", id],
      queryFn: () => getAnimalById(client, id as string),
      enabled: Boolean(id) && (options.enabled ?? true),
    });

  return { useAnimals, useAnimal };
};
