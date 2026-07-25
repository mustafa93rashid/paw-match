import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getMyShelterDetail } from "@paw-match/api-client";

export const createShelterEmployeeShelterHooks = (client: AxiosInstance) => {
  const useMyShelterDetail = (id: string | undefined) =>
    useQuery({
      queryKey: ["shelters", "employee-detail", id],
      queryFn: () => getMyShelterDetail(client, id as string),
      enabled: Boolean(id),
    });

  return { useMyShelterDetail };
};
