import type {
  AccountProfile,
  AuthUser,
  ChangeAccountPasswordInput,
  UpdateAccountProfileInput,
  UploadAccountPhotoInput,
} from "@shared/types";
import { HttpError } from "../utils/http-error";
import { UsersRepository } from "../repositories/users.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import { hashPassword, verifyPassword } from "../utils/password";
import {
  removeAccountPhoto,
  saveAccountPhoto,
} from "../utils/account-photo-storage";

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "Cliente";
  const lastName = parts.slice(1).join(" ") || firstName;

  return {
    firstName,
    lastName,
  };
}

export class AccountService {
  private readonly usersRepository = new UsersRepository();
  private readonly customersRepository = new CustomersRepository();

  async getProfile(authUser: AuthUser): Promise<AccountProfile> {
    const user = await this.requirePersistedUser(authUser);
    const customer = await this.resolveCustomer(user);
    const stats = customer
      ? await this.customersRepository.getStats(customer.id)
      : {
          totalSpentCents: 0,
          lastOrderDate: null,
          orderCount: 0,
          openOrderCount: 0,
        };

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      customerId: customer?.id ?? user.customerId ?? null,
      photoUrl: user.photoUrl ?? null,
      phone: customer?.phone ?? null,
      totalSpentCents: stats.totalSpentCents,
      orderCount: stats.orderCount,
      openOrderCount: stats.openOrderCount,
      lastOrderDate: stats.lastOrderDate,
    };
  }

  async listOrders(authUser: AuthUser) {
    const user = await this.requirePersistedUser(authUser);
    const customer = await this.resolveCustomer(user);

    if (!customer) {
      return [];
    }

    const orders = await this.customersRepository.listOrders(customer.id);
    return orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime ?? null,
      deliveryMode: order.deliveryMode,
      deliveryAddress: order.deliveryAddress ?? null,
      deliveryDistrict: order.deliveryDistrict ?? null,
      status: order.status,
      subtotalAmountCents: order.subtotalAmountCents,
      paidAmountCents: order.paidAmountCents,
      remainingAmountCents: order.remainingAmountCents,
    }));
  }

  async updateProfile(authUser: AuthUser, input: UpdateAccountProfileInput) {
    const user = await this.requirePersistedUser(authUser);
    const nextEmail = input.email.trim().toLowerCase();
    const nextFullName = input.fullName.trim();
    const nextPhotoUrl = input.photoUrl?.trim() || null;

    if (nextEmail !== user.email) {
      const existingEmail = await this.usersRepository.findByEmail(nextEmail);
      if (existingEmail && existingEmail.id !== user.id) {
        throw new HttpError(400, "E-mail já está em uso.");
      }
    }

    const customerId = await this.ensureCustomerLink({
      currentCustomerId: user.customerId ?? null,
      fullName: nextFullName,
      email: nextEmail,
      phone: input.phone?.trim() || null,
    });

    await this.usersRepository.update(user.id, {
      fullName: nextFullName,
      email: nextEmail,
      customerId,
      photoUrl: nextPhotoUrl,
    } as any);

    if (!nextPhotoUrl && user.photoUrl) {
      await removeAccountPhoto(user.photoUrl);
    }

    return this.getProfile({
      id: user.id,
      email: nextEmail,
      name: nextFullName,
      role: user.role,
      customerId,
      photoUrl: nextPhotoUrl,
    });
  }

  async changePassword(authUser: AuthUser, input: ChangeAccountPasswordInput) {
    const user = await this.requirePersistedUser(authUser);
    const valid = await verifyPassword(input.currentPassword, user.password);

    if (!valid) {
      throw new HttpError(400, "Senha atual inválida.");
    }

    const nextPassword = await hashPassword(input.newPassword);
    await this.usersRepository.update(user.id, {
      password: nextPassword,
    });

    return {
      ok: true as const,
    };
  }

  async uploadPhoto(authUser: AuthUser, input: UploadAccountPhotoInput) {
    const user = await this.requirePersistedUser(authUser);

    let photoUrl: string;
    try {
      photoUrl = await saveAccountPhoto({
        userId: user.id,
        mimeType: input.mimeType,
        contentBase64: input.contentBase64,
        previousPhotoUrl: user.photoUrl ?? null,
      });
    } catch (error) {
      throw new HttpError(
        400,
        error instanceof Error ? error.message : "Nao foi possivel salvar a foto.",
      );
    }

    await this.usersRepository.update(user.id, {
      photoUrl,
    });

    return { photoUrl };
  }

  private async requirePersistedUser(authUser: AuthUser) {
    const user =
      (authUser.id ? await this.usersRepository.findById(authUser.id) : null) ??
      (await this.usersRepository.findByEmail(authUser.email));

    if (!user) {
      throw new HttpError(
        400,
        "Esta conta não pode ser editada por este fluxo.",
      );
    }

    return user;
  }

  private async resolveCustomer(user: any) {
    return (
      (user.customerId
        ? await this.customersRepository.findById(user.customerId)
        : null) ?? (await this.customersRepository.findByEmail(user.email))
    );
  }

  private async ensureCustomerLink(input: {
    currentCustomerId: string | null;
    fullName: string;
    email: string;
    phone: string | null;
  }) {
    const names = splitFullName(input.fullName);
    const existingCustomer =
      (input.currentCustomerId
        ? await this.customersRepository.findById(input.currentCustomerId)
        : null) ?? (await this.customersRepository.findByEmail(input.email));

    if (existingCustomer) {
      await this.customersRepository.update(existingCustomer.id, {
        firstName: names.firstName,
        lastName: names.lastName,
        email: input.email,
        phone: input.phone,
        isActive: true,
      } as any);

      return existingCustomer.id;
    }

    const created = await this.customersRepository.create({
      firstName: names.firstName,
      lastName: names.lastName,
      email: input.email,
      phone: input.phone,
      notes: "Cliente vinculado automaticamente a conta autenticada.",
    });

    return created.id;
  }
}
