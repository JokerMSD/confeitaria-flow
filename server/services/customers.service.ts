import type {
  CreateCustomerInput,
  CustomerDetail,
  CustomerListItem,
  ListCustomersFilters,
  UpdateCustomerInput,
} from "@shared/types";
import { HttpError } from "../utils/http-error";
import { CustomersRepository } from "../repositories/customers.repository";
import { CustomerOrderSyncService } from "./customer-order-sync.service";

export class CustomersService {
  private readonly customersRepository = new CustomersRepository();
  private readonly customerOrderSyncService = new CustomerOrderSyncService();

  async list(filters: ListCustomersFilters = {}): Promise<CustomerListItem[]> {
    await this.customerOrderSyncService.syncMissingCustomersFromOrders();
    const customers = await this.customersRepository.list(filters);
    const items = await Promise.all(
      customers.map(async (customer: any) => {
        const stats = await this.customersRepository.getStats(customer.id);

        return {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone ?? null,
          notes: customer.notes ?? null,
          isActive: customer.isActive,
          totalSpentCents: stats.totalSpentCents,
          lastOrderDate: stats.lastOrderDate,
          orderCount: stats.orderCount,
          openOrderCount: stats.openOrderCount,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          deletedAt: customer.deletedAt ?? null,
        };
      }),
    );

    return this.sortList(items, filters.sort);
  }

  async getById(id: string): Promise<CustomerDetail> {
    await this.customerOrderSyncService.syncMissingCustomersFromOrders();
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
      openOrderCount: stats.openOrderCount,
      orders: orders.map((order: any) => ({
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
      })),
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
    const customer = await this.customersRepository.findById(id);

    if (!customer) {
      throw new HttpError(404, "Cliente não encontrado.");
    }

    const stats = await this.customersRepository.getStats(id);

    if (stats.orderCount > 0) {
      throw new HttpError(
        400,
        "Este cliente possui pedidos vinculados e não pode ser excluído.",
      );
    }

    const linkedUsers = await this.customersRepository.countLinkedUsers(id);

    if (linkedUsers > 0) {
      throw new HttpError(
        400,
        "Este cliente está vinculado a uma conta de usuário e não pode ser excluído.",
      );
    }

    await this.customersRepository.softDelete(id, new Date());
  }

  private sortList(
    items: CustomerListItem[],
    sort: ListCustomersFilters["sort"] = "name-asc",
  ) {
    const collator = new Intl.Collator("pt-BR", {
      sensitivity: "base",
      numeric: true,
    });

    const sorted = [...items];

    sorted.sort((left, right) => {
      switch (sort) {
        case "name-desc":
          return collator.compare(
            `${right.firstName} ${right.lastName}`.trim(),
            `${left.firstName} ${left.lastName}`.trim(),
          );
        case "spent-desc":
          return (
            right.totalSpentCents - left.totalSpentCents ||
            collator.compare(
              `${left.firstName} ${left.lastName}`.trim(),
              `${right.firstName} ${right.lastName}`.trim(),
            )
          );
        case "spent-asc":
          return (
            left.totalSpentCents - right.totalSpentCents ||
            collator.compare(
              `${left.firstName} ${left.lastName}`.trim(),
              `${right.firstName} ${right.lastName}`.trim(),
            )
          );
        case "last-order-desc":
          return (
            String(right.lastOrderDate ?? "").localeCompare(
              String(left.lastOrderDate ?? ""),
            ) ||
            collator.compare(
              `${left.firstName} ${left.lastName}`.trim(),
              `${right.firstName} ${right.lastName}`.trim(),
            )
          );
        case "last-order-asc":
          return (
            String(left.lastOrderDate ?? "").localeCompare(
              String(right.lastOrderDate ?? ""),
            ) ||
            collator.compare(
              `${left.firstName} ${left.lastName}`.trim(),
              `${right.firstName} ${right.lastName}`.trim(),
            )
          );
        case "name-asc":
        default:
          return collator.compare(
            `${left.firstName} ${left.lastName}`.trim(),
            `${right.firstName} ${right.lastName}`.trim(),
          );
      }
    });

    return sorted;
  }
}
