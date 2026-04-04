import type {
  AuthSessionResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from "@shared/types";
import { httpClient } from "./http-client";

export function getAuthSession() {
  return httpClient<AuthSessionResponse>("/api/auth/me", {
    suppressUnauthorizedEvent: true,
  });
}

export function login(payload: LoginRequest) {
  return httpClient<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function logout() {
  return httpClient<LogoutResponse>("/api/auth/logout", {
    method: "POST",
  });
}
