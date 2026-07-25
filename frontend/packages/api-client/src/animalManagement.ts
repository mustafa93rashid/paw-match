/**
 * Shelter-employee/superadmin endpoint functions for
 * src/routes/animal.route.js's write actions. Kept separate from
 * ./animals.ts, which is documented there as the read-only getAll/getOne
 * subset only.
 */
import type { AxiosInstance } from "axios";
import type { Animal, AnimalPayload } from "@paw-match/types";

/** POST /animals — shelterId is derived server-side from the caller's own ShelterEmployeeProfile; images/isActive/adoptionStatus/addedBy are rejected if present. New animals are forced adoptionStatus:"unavailable" until an image is added. */
export const createAnimal = async (client: AxiosInstance, payload: AnimalPayload): Promise<Animal> => {
  const { data } = await client.post<{ success: true; message: string; data: Animal }>(
    "/animals",
    payload,
  );
  return data.data;
};

/** PATCH /animals/:id — same field set as create; shelterId/isActive/adoptionStatus/images are rejected if present (400). */
export const updateAnimal = async (
  client: AxiosInstance,
  id: string,
  payload: AnimalPayload,
): Promise<Animal> => {
  const { data } = await client.patch<{ success: true; message: string; data: Animal }>(
    `/animals/${id}`,
    payload,
  );
  return data.data;
};

/** DELETE /animals/:id — soft delete only (sets isActive:false). 400 if already inactive or if adoptionStatus is "adopted". */
export const deleteAnimal = async (client: AxiosInstance, id: string): Promise<Animal> => {
  const { data } = await client.delete<{ success: true; message: string; data: Animal }>(
    `/animals/${id}`,
  );
  return data.data;
};

/** PATCH /animals/:id/restore — used only as an immediate "Undo" right after delete; there is no backend capability to list soft-deleted animals afterward. */
export const restoreAnimal = async (client: AxiosInstance, id: string): Promise<Animal> => {
  const { data } = await client.patch<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/restore`,
  );
  return data.data;
};

const buildImagesFormData = (files: File[]): FormData => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return formData;
};

/** POST /animals/:id/images — multipart field "images" (array), max 8 total on the animal (400 past that). First-ever image is auto-marked primary and flips adoptionStatus "unavailable" -> "available". */
export const addAnimalImages = async (
  client: AxiosInstance,
  id: string,
  files: File[],
): Promise<Animal> => {
  const { data } = await client.post<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/images`,
    buildImagesFormData(files),
  );
  return data.data;
};

/** PATCH /animals/:id/images/:imageId — multipart field "image" (single); preserves the isPrimary flag of the replaced slot. */
export const replaceAnimalImage = async (
  client: AxiosInstance,
  id: string,
  imageId: string,
  file: File,
): Promise<Animal> => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await client.patch<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/images/${imageId}`,
    formData,
  );
  return data.data;
};

/** PATCH /animals/:id/images/:imageId/primary */
export const setPrimaryAnimalImage = async (
  client: AxiosInstance,
  id: string,
  imageId: string,
): Promise<Animal> => {
  const { data } = await client.patch<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/images/${imageId}/primary`,
  );
  return data.data;
};

/** DELETE /animals/:id/images/:imageId — if the deleted image was primary, the next remaining image becomes primary; if it was the last image, adoptionStatus is forced back to "unavailable". */
export const deleteAnimalImage = async (
  client: AxiosInstance,
  id: string,
  imageId: string,
): Promise<Animal> => {
  const { data } = await client.delete<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/images/${imageId}`,
  );
  return data.data;
};

/** DELETE /animals/:id/images — clears all images, forces adoptionStatus to "unavailable". 404 if the animal already has no images. */
export const deleteAllAnimalImages = async (client: AxiosInstance, id: string): Promise<Animal> => {
  const { data } = await client.delete<{ success: true; message: string; data: Animal }>(
    `/animals/${id}/images`,
  );
  return data.data;
};
