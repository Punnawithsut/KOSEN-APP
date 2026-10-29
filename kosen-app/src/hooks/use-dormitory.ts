import { useApi } from "@/lib/api/use-api";
import { apiErrorFromResponse } from "@/lib/api/fetcher";
import type { ApiResponse } from "@/lib/api/types";
import type { DormHandbook } from "@/lib/dormitory/data";

export type DormDashboard = {
  wardens: Record<string, unknown>[];
  forms: Record<string, unknown>[];
  rules: Record<string, unknown>[];
  handbook: DormHandbook | null;
};

export function useDormitory(initialData?: ApiResponse<DormDashboard>) {
  const swr = useApi<ApiResponse<DormDashboard>>("/api/dorm", {
    fallbackData: initialData,
  });

  async function saveJson(url: string, method: "POST" | "PUT" | "DELETE", body?: Record<string, unknown>) {
    const response = await fetch(url, {
      method,
      ...(body ? {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      } : {}),
    });
    if (!response.ok) throw await apiErrorFromResponse(response);
    const result = response.status === 204 ? undefined : await response.json();
    await swr.mutate();
    return result as { data?: Record<string, unknown> } | undefined;
  }

  async function uploadHandbook(formData: FormData) {
    const response = await fetch("/api/dorm/handbook", { method: "POST", body: formData });
    if (!response.ok) throw await apiErrorFromResponse(response);
    const result = await response.json();
    await swr.mutate();
    return result;
  }

  async function uploadStaffPhoto(id: string, file: File) {
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch(`/api/dorm/dormwardens/${encodeURIComponent(id)}/photo`, { method: "POST", body: formData });
    if (!response.ok) throw await apiErrorFromResponse(response);
    await swr.mutate();
  }

  return { ...swr, saveJson, uploadHandbook, uploadStaffPhoto };
}
