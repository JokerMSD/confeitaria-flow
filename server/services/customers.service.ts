import type {
  CreateCustomerInput,
  CustomerDetail,
  CustomerListItem,
  UpdateCustomerInput,
} from "@shared/types";
import { HttpError } from "../utils/http-error";
import { CustomersRepository } from "../repositories/customers.repository";

export class CustomersService {
  private readonly customersRepository = new CustomersRepository();

  async list(): Promise<CustomerListItem[]> {
    const customers = await this.customersRepository.list();
    return customers.map((customer: any) => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? null,
      notes: customer.notes ?? null,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      deletedAt: customer.deletedAt ?? null,
    }));
  }

  async getById(id: string): Promise<CustomerDetail> {
    const customer = await this.customersRepository.findById(id);

    if (!customer) {
      throw new HttpError(404, "Cliente não encontrado.");
    }

    const stats = await this.customersRepository.getStats(id);
    const orders = await this.customersRepository.listOrders(id);

    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? null,
      notes: customer.notes ?? null,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      deletedAt: customer.deletedAt ?? null,
      totalSpentCents: stats.totalSpentCents,
      lastOrderDate: stats.lastOrderDate,
      orderCount: stats.orderCount,
    };
  }

  async create(input: CreateCustomerInput): Promise<CustomerDetail> {
    const existing = await this.customersRepository.findByEmail(input.email);

    if (existing) {
      throw new HttpError(400, "Já existe um cliente com este e-mail.");
    }

    const created = await this.customersRepository.create({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
    });

    return this.getById(created.id);
  }

  async update(
    id: string,
    input: UpdateCustomerInput,
  ): Promise<CustomerDetail> {
    const customer = await this.customersRepository.findById(id);

    if (!customer) {
      throw new HttpError(404, "Cliente não encontrado.");
    }

    if (input.email && input.email !== customer.email) {
      const existing = await this.customersRepository.findByEmail(input.email);
      if (existing) {
        throw new HttpError(400, "Já existe um cliente com este e-mail.");
      }
    }

    await this.customersRepository.update(id, {
      firstName: input.firstName?.trim() ?? customer.firstName,
      lastName: input.lastName?.trim() ?? customer.lastName,
      email: input.email?.trim().toLowerCase() ?? customer.email,
      phone: input.phone?.trim() ?? customer.phone,
      notes: input.notes?.trim() ?? customer.notes,
      isActive: input.isActive ?? customer.isActive,
    } as any);

    return this.getById(id);
  }

  async deactivate(id: string): Promise<CustomerDetail> {
    await this.customersRepository.deactivate(id);
    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await this.customersRepository.softDelete(id, new Date());
  }
}
