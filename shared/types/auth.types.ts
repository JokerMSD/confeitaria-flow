export interface AuthUser {
  email: string;
  name: string;
  role?: "admin" | "operador";
}

export interface LoginInput {
  email: string;
  password: string;
}
