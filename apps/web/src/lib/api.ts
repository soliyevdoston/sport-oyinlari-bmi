export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "/api/v1";

export interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  role: "USER" | "ADMIN";
  favoriteSport?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new ApiError((payload.message as string) ?? "Request failed", response.status);
  }

  return payload as T;
}
