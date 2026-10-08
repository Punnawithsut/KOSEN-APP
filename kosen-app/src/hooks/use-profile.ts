import { useApi } from "@/lib/api/use-api";
import { usePut } from "@/lib/api/use-mutation";

type ApiResponse<T> = {
  data: T;
};

export type MyProfile = {
  userId: string;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  department: string | null;
  year: number | null;
  dormBuilding: string | null;
  dormRoom: string | null;
  avatarUrl: string | null;
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
  const result = useApi<ApiResponse<MyProfile>>("/api/profile");
  return { ...result, data: result.data?.data };
}

export function useUpdateMyProfile() {
  return usePut<ApiResponse<MyProfile>>("/api/profile", {
    revalidateKeys: "/api/profile",
  });
}
