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
