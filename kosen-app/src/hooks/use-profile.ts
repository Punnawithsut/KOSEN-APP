import { useApi } from "@/lib/api/use-api";
import { usePut } from "@/lib/api/use-mutation";

type ApiResponse<T> = {
  data: T;
};

export type MyProfile = {
  userId: string;
  studentId: string | null;
  // Mirrors the `user_role` pgEnum in `src/db/schema.ts`. `getUserById` selects
  // the whole row, so this is already on the wire — it was just missing here.
  role: "user" | "counselor" | "admin";
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  department: string | null;
  year: number | null;
  dormBuilding: string | null;
  dormRoom: string | null;
  avatarUrl: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type UpdateMyProfile = {
  studentId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  year?: number;
  dormBuilding?: string;
  dormRoom?: string;
};

export function useMyProfile() {
  return useApi<ApiResponse<MyProfile>>("/api/profile");
}

export function useUpdateMyProfile() {
  return usePut<ApiResponse<MyProfile>>("/api/profile");
}
