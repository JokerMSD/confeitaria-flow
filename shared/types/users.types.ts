export type UserRole = "admin" | "operador" | "user";

export interface UserItem {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  customerId?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateUserInput {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  customerId?: string | null;
  photoUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  fullName?: string;
  password?: string;
  role?: UserRole;
  customerId?: string | null;
  photoUrl?: string | null;
  isActive?: boolean;
}
