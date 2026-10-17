export class ApiError extends Error {
  status: number;
  info: unknown;

  constructor(message: string, status: number, info: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.info = info;
  }
}

export async function apiErrorFromResponse(res: Response): Promise<ApiError> {
  let info: unknown;

  try {
    info = await res.json();
  } catch {
    info = null;
  }

  const message =
    typeof info === "object" && info !== null
      ? "error" in info && typeof info.error === "string"
        ? info.error
        : "message" in info && typeof info.message === "string"
          ? info.message
          : null
      : null;

  return new ApiError(
    message ?? `Request failed (${res.status})`,
    res.status,
    info,
  );
}

export async function apiFetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}