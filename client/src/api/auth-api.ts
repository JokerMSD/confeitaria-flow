import type {
  AuthSessionResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationEmailRequest,
  ResendVerificationEmailResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
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

export function register(payload: RegisterRequest) {
  return httpClient<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function verifyEmail(payload: VerifyEmailRequest) {
  return httpClient<VerifyEmailResponse>("/api/auth/verify-email", {
    method: "POST",
    body: payload,
  });
}

export function resendVerificationEmail(payload: ResendVerificationEmailRequest) {
  return httpClient<ResendVerificationEmailResponse>(
    "/api/auth/resend-verification-email",
    {
      method: "POST",
      body: payload,
    },
  );
}

export function logout() {
  return httpClient<LogoutResponse>("/api/auth/logout", {
    method: "POST",
  });
}
