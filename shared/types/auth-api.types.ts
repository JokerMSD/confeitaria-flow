import type { AuthUser, LoginInput } from "./auth.types";

export interface AuthSessionResponse {
  data: AuthUser;
}

export interface LoginRequest {
  data: LoginInput;
}

export interface LoginResponse {
  data: AuthUser;
}

export interface LogoutResponse {
  data: {
    ok: true;
  };
}
