/** Endpoint function for src/routes/profiles/shelterEmployeeProfile.routes.js's only shelterEmployee self-service route. */
import type { AxiosInstance } from "axios";
import type { ShelterEmployeeProfile } from "@paw-match/types";

/** GET /shelter-employee-profile/me — the only way a shelterEmployee learns their own shelter's id (data.shelterId._id, null if not yet assigned). 404 if no profile exists at all. */
export const getMyShelterEmployeeProfile = async (
  client: AxiosInstance,
): Promise<ShelterEmployeeProfile> => {
  const { data } = await client.get<{ success: true; message: string; data: ShelterEmployeeProfile }>(
    "/shelter-employee-profile/me",
  );
  return data.data;
};
