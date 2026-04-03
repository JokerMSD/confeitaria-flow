import type { AuthUser, LoginInput } from "@shared/types";
import { HttpError } from "../../utils/http-error";
import { UsersService } from "../../services/users.service";

interface ConfiguredAuthUser extends AuthUser {
  password: string;
}

function parseAuthUsers(): ConfiguredAuthUser[] {
  const rawJson = process.env.AUTH_USERS_JSON?.trim();

  if (rawJson) {
    const parsed = JSON.parse(rawJson) as Array<{
      email: string;
      password: string;
      name?: string;
    }>;

    return parsed
      .filter((entry) => entry.email && entry.password)
      .map((entry) => ({
        email: entry.email.trim().toLowerCase(),
        password: entry.password,
        name: entry.name?.trim() || entry.email.trim(),
        role: "admin" as const,
      }));
  }

  const email = process.env.AUTH_EMAIL?.trim();
  const password = process.env.AUTH_PASSWORD?.trim();

  if (email && password) {
    return [
      {
        email: email.toLowerCase(),
        password,
        name: process.env.AUTH_NAME?.trim() || email,
        role: "admin" as const,
      },
    ];
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_USERS_JSON or AUTH_EMAIL/AUTH_PASSWORD must be configured.",
    );
  }

  return [
      {
        email: "admin@docegestao.com",
        password: "admin123",
        name: "Admin",
        role: "admin",
      },
    ];
}

export class AuthService {
  private readonly usersService = new UsersService();
  private readonly users = parseAuthUsers();

  async login(input: LoginInput): Promise<AuthUser> {
    const email = input.email.trim().toLowerCase();
    const password = input.password.trim();

    if (!email || !password) {
      throw new HttpError(400, "Email and password are required.");
    }

    const hasPersistedUsers = await this.resolvePersistedUsersAvailability();

    try {
      const user = await this.usersService.authenticate(email, password);
      return user;
    } catch (error) {
      if (hasPersistedUsers) {
        throw error;
      }
    }

    const user = this.users.find(
      (candidate) =>
        candidate.email === email && candidate.password === password,
    );

    if (!user) {
      throw new HttpError(401, "Invalid email or password.");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customerId ?? null,
      photoUrl: user.photoUrl ?? null,
    };
  }

  private async resolvePersistedUsersAvailability() {
    try {
      return await this.usersService.hasPersistedActiveUsers();
    } catch {
      return false;
    }
  }
}
