import { useApi } from "@/lib/api/use-api";
import { usePut } from "@/lib/api/use-mutation";
import type { ApiResponse } from "@/lib/api/types";

export type MyProfile = {
  userId: string;
  studentId: string | null;
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

export function useMyProfile(initialData?: ApiResponse<MyProfile>) {
  return useApi<ApiResponse<MyProfile>>("/api/profile", {
    fallbackData: initialData,
  });
}

export function useUpdateMyProfile() {
  return usePut<ApiResponse<MyProfile>>("/api/profile");
}
