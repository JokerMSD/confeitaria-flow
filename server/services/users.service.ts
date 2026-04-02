import type {
  CreateUserInput,
  UpdateUserInput,
  UserItem,
  UserRole,
} from "@shared/types";
import { HttpError } from "../utils/http-error";
import { UsersRepository } from "../repositories/users.repository";
import { hashPassword, verifyPassword } from "../utils/password";

export class UsersService {
  private readonly usersRepository = new UsersRepository();

  async list(): Promise<UserItem[]> {
    const rows = await this.usersRepository.list();
    return rows.map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      fullName: row.fullName,
      role: row.role as UserRole,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    }));
  }

  async getById(id: string): Promise<UserItem> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new HttpError(404, "Usuário não encontrado.");
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt ?? null,
    };
  }

  async create(input: CreateUserInput): Promise<UserItem> {
    const existingEmail = await this.usersRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new HttpError(400, "E-mail já em uso.");
    }

    const existingUsername = await this.usersRepository.findByUsername(
      input.username,
    );
    if (existingUsername) {
      throw new HttpError(400, "Nome de usuário já em uso.");
    }

    const hashed = await hashPassword(input.password);

    const row = await this.usersRepository.create({
      username: input.username.toLowerCase(),
      email: input.email.toLowerCase(),
      fullName: input.fullName.trim(),
      password: hashed,
      role: input.role,
      isActive: input.isActive ?? true,
    });

    return this.getById(row.id);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserItem> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new HttpError(404, "Usuário não encontrado.");
    }

    if (input.email && input.email !== user.email) {
      const existingEmail = await this.usersRepository.findByEmail(input.email);
      if (existingEmail) {
        throw new HttpError(400, "E-mail já em uso.");
      }
    }

    if (input.username && input.username !== user.username) {
      const existingUsername = await this.usersRepository.findByUsername(
        input.username,
      );
      if (existingUsername) {
        throw new HttpError(400, "Nome de usuário já em uso.");
      }
    }

    const updateData: any = {
      username: input.username?.toLowerCase() ?? user.username,
      email: input.email?.toLowerCase() ?? user.email,
      fullName: input.fullName?.trim() ?? user.fullName,
      role: input.role ?? user.role,
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

  async authenticate(emailOrUsername: string, password: string) {
    const lookup =
      (await this.usersRepository.findByEmail(emailOrUsername.toLowerCase())) ||
      (await this.usersRepository.findByUsername(
        emailOrUsername.toLowerCase(),
      ));

    if (!lookup || !lookup.isActive) {
      throw new HttpError(401, "Usuário ou senha inválidos.");
    }

    const valid = await verifyPassword(password, lookup.password);
    if (!valid) {
      throw new HttpError(401, "Usuário ou senha inválidos.");
    }

    return {
      email: lookup.email,
      name: lookup.fullName,
      role: lookup.role as UserRole,
    };
  }
}
