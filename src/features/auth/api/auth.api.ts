import { apiClient } from "@/lib/api/client"
import type { UserSummary } from "@/types/api"

export interface Credentials {
  email: string
  password: string
}

/** `POST /auth/login` — the only endpoint that returns an access token in its body. */
export interface LoginResponse {
  user: UserSummary
  accessToken: string
}

export const authApi = {
  /**
   * Returns the created user but **no tokens and no cookie** — registration does not sign
   * you in. Callers must follow up with `login`.
   */
  register: async (credentials: Credentials) =>
    (await apiClient.post<UserSummary>("/auth/register", credentials)).data,

  login: async (credentials: Credentials) =>
    (await apiClient.post<LoginResponse>("/auth/login", credentials)).data,

  me: async () => (await apiClient.get<UserSummary>("/auth/me")).data,

  /** Revokes the current session server-side and clears the refresh cookie. */
  logout: async () => {
    await apiClient.post("/auth/logout")
  }
}
