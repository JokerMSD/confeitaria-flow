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

    const hasPersistedCandidate = await this.resolvePersistedCandidate(email);

    if (hasPersistedCandidate) {
      return this.usersService.authenticate(email, password);
    }

    const configuredUser = this.users.find(
      (candidate) =>
        candidate.email === email && candidate.password === password,
    );

    if (!configuredUser) {
      throw new HttpError(401, "Invalid email or password.");
    }

    try {
      return await this.usersService.ensureConfiguredAuthUser({
        email: configuredUser.email,
        fullName: configuredUser.name,
        password: configuredUser.password,
        role: configuredUser.role ?? "admin",
        customerId: configuredUser.customerId ?? null,
        photoUrl: configuredUser.photoUrl ?? null,
      });
    } catch {
      return {
        id: configuredUser.id,
        email: configuredUser.email,
        name: configuredUser.name,
        role: configuredUser.role,
        customerId: configuredUser.customerId ?? null,
        photoUrl: configuredUser.photoUrl ?? null,
      };
    }
  }

  private async resolvePersistedCandidate(email: string) {
    try {
      return await this.usersService.hasPersistedUserForLogin(email);
    } catch {
      return false;
    }
  }
}
