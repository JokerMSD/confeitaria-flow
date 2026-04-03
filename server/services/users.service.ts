import type {
  AuthUser,
  CreateUserInput,
  UpdateUserInput,
  UserItem,
  UserRole,
} from "@shared/types";
import { HttpError } from "../utils/http-error";
import { UsersRepository } from "../repositories/users.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import { hashPassword, verifyPassword } from "../utils/password";

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "Cliente";
  const lastName = parts.slice(1).join(" ") || firstName;

  return {
    firstName,
    lastName,
  };
}

export class UsersService {
  private readonly usersRepository = new UsersRepository();
  private readonly customersRepository = new CustomersRepository();

  private mapUserItem(row: any): UserItem {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      fullName: row.fullName,
      role: row.role as UserRole,
      customerId: row.customerId ?? null,
      photoUrl: row.photoUrl ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    };
  }

  async list(): Promise<UserItem[]> {
    const rows = await this.usersRepository.list();
    return rows.map((row: any) => this.mapUserItem(row));
  }

  async getById(id: string): Promise<UserItem> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new HttpError(404, "Usuário não encontrado.");
    }

    return this.mapUserItem(user);
  }

  async create(input: CreateUserInput): Promise<UserItem> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedUsername = input.username.trim().toLowerCase();
    const normalizedFullName = input.fullName.trim();

    const existingEmail = await this.usersRepository.findByEmail(normalizedEmail);
    if (existingEmail) {
      throw new HttpError(400, "E-mail já em uso.");
    }

    const existingUsername = await this.usersRepository.findByUsername(
      normalizedUsername,
    );
    if (existingUsername) {
      throw new HttpError(400, "Nome de usuário já em uso.");
    }

    const hashed = await hashPassword(input.password);
    const linkedCustomerId = await this.resolveLinkedCustomerId({
      role: input.role,
      customerId: input.customerId ?? null,
      fullName: normalizedFullName,
      email: normalizedEmail,
    });

    const row = await this.usersRepository.create({
      username: normalizedUsername,
      email: normalizedEmail,
      fullName: normalizedFullName,
      password: hashed,
      role: input.role,
      customerId: linkedCustomerId,
      photoUrl: input.photoUrl?.trim() || null,
      isActive: input.isActive ?? true,
    });

    return this.getById(row.id);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserItem> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new HttpError(404, "Usuário não encontrado.");
    }

    const nextEmail = input.email?.trim().toLowerCase() ?? user.email;
    const nextUsername = input.username?.trim().toLowerCase() ?? user.username;
    const nextFullName = input.fullName?.trim() ?? user.fullName;
    const nextRole = input.role ?? (user.role as UserRole);

    if (nextEmail !== user.email) {
      const existingEmail = await this.usersRepository.findByEmail(nextEmail);
      if (existingEmail && existingEmail.id !== id) {
        throw new HttpError(400, "E-mail já em uso.");
      }
    }

    if (nextUsername !== user.username) {
      const existingUsername = await this.usersRepository.findByUsername(
        nextUsername,
      );
      if (existingUsername && existingUsername.id !== id) {
        throw new HttpError(400, "Nome de usuário já em uso.");
      }
    }

    const updateData: any = {
      username: nextUsername,
      email: nextEmail,
      fullName: nextFullName,
      role: nextRole,
      customerId: await this.resolveLinkedCustomerId({
        role: nextRole,
        customerId:
          input.customerId !== undefined
            ? input.customerId
            : (user.customerId ?? null),
        fullName: nextFullName,
        email: nextEmail,
      }),
      photoUrl:
        input.photoUrl !== undefined ? input.photoUrl?.trim() || null : user.photoUrl,
      isActive: input.isActive ?? user.isActive,
    };

    if (input.password) {
      updateData.password = await hashPassword(input.password);
    }

    await this.usersRepository.update(id, updateData);
    return this.getById(id);
  }

  async setActiveStatus(id: string, isActive: boolean): Promise<UserItem> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new HttpError(404, "Usuário não encontrado.");
    }

    const updated = isActive
      ? await this.usersRepository.activate(id)
      : await this.usersRepository.deactivate(id);

    if (!updated) {
      throw new HttpError(
        404,
        "Usuário não encontrado ou não pode ser atualizado.",
      );
    }

    return this.getById(id);
  }

  async authenticate(emailOrUsername: string, password: string): Promise<AuthUser> {
    const lookup = await this.usersRepository.findByEmailOrUsername(emailOrUsername);

    if (!lookup || !lookup.isActive) {
      throw new HttpError(401, "Usuário ou senha inválidos.");
    }

    const valid = await verifyPassword(password, lookup.password);
    if (!valid) {
      throw new HttpError(401, "Usuário ou senha inválidos.");
    }

    return {
      id: lookup.id,
      email: lookup.email,
      name: lookup.fullName,
      role: lookup.role as UserRole,
      customerId: lookup.customerId ?? null,
      photoUrl: lookup.photoUrl ?? null,
    };
  }

  async hasPersistedActiveUsers() {
    return (await this.usersRepository.countActive()) > 0;
  }

  async getAuthenticatedUserProfile(authUser: AuthUser) {
    if (authUser.id) {
      const byId = await this.usersRepository.findById(authUser.id);
      if (byId) {
        return byId;
      }
    }

    const byEmail = await this.usersRepository.findByEmail(authUser.email);
    return byEmail;
  }

  private async resolveLinkedCustomerId(input: {
    role: UserRole;
    customerId: string | null;
    fullName: string;
    email: string;
  }) {
    if (input.role !== "user") {
      return input.customerId;
    }

    const names = splitFullName(input.fullName);
    const existingCustomer =
      (input.customerId
        ? await this.customersRepository.findById(input.customerId)
        : null) ?? (await this.customersRepository.findByEmail(input.email));

    if (existingCustomer) {
      await this.customersRepository.update(existingCustomer.id, {
        firstName: names.firstName,
        lastName: names.lastName,
        email: input.email,
        isActive: true,
      } as any);

      return existingCustomer.id;
    }

    const createdCustomer = await this.customersRepository.create({
      firstName: names.firstName,
      lastName: names.lastName,
      email: input.email,
      phone: null,
      notes: "Cliente vinculado automaticamente a uma conta autenticada.",
    });

    return createdCustomer.id;
  }
}
