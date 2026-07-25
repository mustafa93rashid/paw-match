/**
 * GET /shelters/:id called by a shelterEmployee for their own shelter — the
 * backend returns the "shelterEmployee" accessLevel branch (employees
 * populated) rather than the adopter-facing AuthedShelterDetail shape that
 * ./shelters.ts's getShelterById is typed for. Kept separate for that
 * reason, same convention as every other admin/employee-facing split file.
 */
import type { AxiosInstance } from "axios";
import type { ShelterEmployeeShelterDetail } from "@paw-match/types";

export const getMyShelterDetail = async (
  client: AxiosInstance,
  id: string,
): Promise<ShelterEmployeeShelterDetail> => {
  const { data } = await client.get<{
    success: true;
    accessLevel: "shelterEmployee";
    data: ShelterEmployeeShelterDetail;
  }>(`/shelters/${id}`);
  return data.data;
};
