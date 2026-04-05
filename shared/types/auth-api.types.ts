import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  ResendVerificationEmailInput,
  VerifyEmailInput,
} from "./auth.types";

export interface AuthSessionResponse {
  data: AuthUser;
}

export interface LoginRequest {
  data: LoginInput;
}

export interface LoginResponse {
  data: AuthUser;
}

export interface RegisterRequest {
  data: RegisterInput;
}

export interface RegisterResponse {
  data: {
    email: string;
    verificationRequired: true;
    message: string;
  };
}

export interface VerifyEmailRequest {
  data: VerifyEmailInput;
}

export interface VerifyEmailResponse {
  data: {
    ok: true;
    email: string;
  };
}

export interface ResendVerificationEmailRequest {
  data: ResendVerificationEmailInput;
}

export interface ResendVerificationEmailResponse {
  data: {
    ok: true;
    email: string;
  };
}

export interface LogoutResponse {
  data: {
    ok: true;
  };
}
