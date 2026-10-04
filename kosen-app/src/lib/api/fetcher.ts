export class ApiError extends Error {
    status: number;
    info: unknown;
    
    constructor(message: string, status: number, info: unknown) {
        super(message);
        this.status = status;
        this.info = info;
    }
}

async function parseErrorBody(res: Response): Promise<unknown> {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

export async function apiFetcher<T = unknown>(url: string): Promise<T> {
    const res = await fetch(url);
    if(!res.ok) {
        const info = parseErrorBody(res);
        const message = (info as { message?: string } | null)?.message ?? `Request failed (${res.status})`;
        throw new ApiError(message, res.status, info);
    }
    if(res.status === 204) return undefined as T;
    return res.json();
}