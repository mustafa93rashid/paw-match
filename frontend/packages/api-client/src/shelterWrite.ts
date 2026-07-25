/**
 * Shared write endpoints for src/routes/shelter.route.js's create/update/
 * logo/gallery actions — genuinely shared between superadmin (full access)
 * and a shelterEmployee manager (their own shelter only; enforced entirely
 * server-side by checkShelterEmployeePermission). Kept separate from
 * ./shelterAdmin.ts (superadmin-only actions: approve/reject/status/
 * permanent-delete/employee-assignment) since these routes behave
 * identically regardless of which role calls them.
 */
import type { AxiosInstance } from "axios";
import type { AdminShelter, ShelterPayload } from "@paw-match/types";

/** POST /shelters — shelterEmployee callers get auto-linked as the shelter's first employee server-side (see shelter.controller.js createShelter); 409 if that employee already has a shelterId. */
export const createShelter = async (client: AxiosInstance, payload: ShelterPayload): Promise<AdminShelter> => {
  const { data } = await client.post<{ success: true; message: string; data: AdminShelter }>("/shelters", payload);
  return data.data;
};

/** PATCH /shelters/:id — a shelterEmployee (manager) update resets verificationStatus to "pending" and isActive to false server-side; a superadmin update does not. */
export const updateShelter = async (
  client: AxiosInstance,
  id: string,
  payload: ShelterPayload,
): Promise<AdminShelter> => {
  const { data } = await client.patch<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}`,
    payload,
  );
  return data.data;
};

/** PATCH /shelters/:id/logo — multipart field "image"; 400 if a logo already exists (use replace instead). */
export const uploadShelterLogo = async (client: AxiosInstance, id: string, file: File): Promise<AdminShelter> => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await client.patch<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/logo`,
    formData,
  );
  return data.data;
};

/** PATCH /shelters/:id/logo/replace — multipart field "image". */
export const replaceShelterLogo = async (client: AxiosInstance, id: string, file: File): Promise<AdminShelter> => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await client.patch<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/logo/replace`,
    formData,
  );
  return data.data;
};

/** DELETE /shelters/:id/logo — 404 if no logo exists. */
export const deleteShelterLogo = async (client: AxiosInstance, id: string): Promise<AdminShelter> => {
  const { data } = await client.delete<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/logo`,
  );
  return data.data;
};

/** POST /shelters/:id/images — multipart field "images" (array); 400 if the total would exceed 8. */
export const addShelterGalleryImages = async (
  client: AxiosInstance,
  id: string,
  files: File[],
): Promise<AdminShelter> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const { data } = await client.post<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/images`,
    formData,
  );
  return data.data;
};

/**
 * DELETE /shelters/:id/images/:publicId — 400 if this would remove the
 * shelter's last remaining gallery image (at least one must always remain).
 * The backend reads `publicId` from the URL param (primary) with a body
 * fallback; this sends both — the URL segment (encoded, since Cloudinary
 * public IDs contain "/") and a JSON body, so it works regardless of which
 * source is authoritative.
 */
export const deleteShelterGalleryImage = async (
  client: AxiosInstance,
  id: string,
  publicId: string,
): Promise<AdminShelter> => {
  const { data } = await client.delete<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/images/${encodeURIComponent(publicId)}`,
    { data: { publicId } },
  );
  return data.data;
};
