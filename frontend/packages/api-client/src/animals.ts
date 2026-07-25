/**
 * Endpoint functions for src/routes/animal.route.js +
 * src/controllers/animal.controller.js `getAll`/`getOne` — both require
 * auth (any role, no dedicated adopter restriction). `getAll` always forces
 * isActive:true for non-superadmin regardless of query params, returns no
 * `count` field, and has no server-side sort or pagination at all.
 */
import type { AxiosInstance } from "axios";
import type { Animal, Species } from "@paw-match/types";

export interface AnimalsParams {
  species?: Species;
  breed?: string;
  gender?: "male" | "female";
  size?: "small" | "medium" | "large";
  healthStatus?: string;
  adoptionStatus?: "available" | "pending" | "adopted" | "unavailable";
  shelterId?: string;
  vaccinated?: "true" | "false";
  search?: string;
  /** Superadmin-only — every other role gets isActive:true forced regardless of this param (see getAll's own doc comment above). */
  isActive?: "true" | "false";
}

export const getAnimals = async (
  client: AxiosInstance,
  params: AnimalsParams = {},
): Promise<Animal[]> => {
  const { data } = await client.get<{ success: true; message: string; data: Animal[] }>(
    "/animals",
    { params },
  );

  return data.data;
};

export const getAnimalById = async (client: AxiosInstance, id: string): Promise<Animal> => {
  const { data } = await client.get<{ success: true; message: string; data: Animal }>(
    `/animals/${id}`,
  );

  return data.data;
};
