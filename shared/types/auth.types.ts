export interface AuthUser {
  id?: string;
  email: string;
  name: string;
  role?: "admin" | "operador" | "user";
  customerId?: string | null;
  photoUrl?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface ResendVerificationEmailInput {
  email: string;
}
