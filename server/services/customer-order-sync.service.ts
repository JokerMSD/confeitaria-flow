import { getPool } from "../db/client";

interface ExistingCustomerRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

interface OrderCandidateRow {
  id: string;
  customer_name: string;
  customer_phone: string | null;
}

function normalizeCustomerName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function splitCustomerName(fullName: string) {
  const sanitized = fullName.replace(/\s+/g, " ").trim();
  const parts = sanitized.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "Cliente", lastName: "Importado" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Importado" };
  }

  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function slugify(value: string) {
  return normalizeCustomerName(value)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 48);
}

function buildImportedCustomerEmail(baseName: string, suffix: number) {
  const slug = slugify(baseName) || "cliente.importado";
  return suffix === 0
    ? `${slug}@imported.local`
    : `${slug}.${suffix}@imported.local`;
}

export interface CustomerOrderSyncSummary {
  createdCustomerCount: number;
  updatedCustomerPhoneCount: number;
  linkedOrderCount: number;
  createdCustomers: Array<{ id: string; name: string }>;
}

export class CustomerOrderSyncService {
  async syncMissingCustomersFromOrders(): Promise<CustomerOrderSyncSummary> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("begin");

      const existingCustomersResult = await client.query<ExistingCustomerRow>(`
        select id, first_name, last_name, email, phone
        from customers
        where deleted_at is null
      `);

      const ordersResult = await client.query<OrderCandidateRow>(`
        select id, customer_name, customer_phone
        from orders
        where deleted_at is null
          and customer_id is null
          and nullif(trim(customer_name), '') is not null
        order by created_at asc
      `);

      if (ordersResult.rows.length === 0) {
        await client.query("commit");
        return {
          createdCustomerCount: 0,
          updatedCustomerPhoneCount: 0,
          linkedOrderCount: 0,
          createdCustomers: [],
        };
      }

      const customersByNormalizedName = new Map<string, ExistingCustomerRow>();
      const usedEmails = new Set(
        existingCustomersResult.rows.map((row) => row.email.toLowerCase()),
      );

      for (const customer of existingCustomersResult.rows) {
        const normalized = normalizeCustomerName(
          `${customer.first_name} ${customer.last_name}`,
        );

        if (!customersByNormalizedName.has(normalized)) {
          customersByNormalizedName.set(normalized, customer);
        }
      }

      const orderIdsByNormalizedName = new Map<string, string[]>();
      const phoneByNormalizedName = new Map<string, string>();
      const originalNameByNormalizedName = new Map<string, string>();

      for (const order of ordersResult.rows) {
        const normalized = normalizeCustomerName(order.customer_name);
        if (!normalized) continue;

        const currentOrderIds = orderIdsByNormalizedName.get(normalized) ?? [];
        currentOrderIds.push(order.id);
        orderIdsByNormalizedName.set(normalized, currentOrderIds);

        if (!originalNameByNormalizedName.has(normalized)) {
          originalNameByNormalizedName.set(normalized, order.customer_name.trim());
        }

        const phone = order.customer_phone?.trim();
        if (phone && !phoneByNormalizedName.has(normalized)) {
          phoneByNormalizedName.set(normalized, phone);
        }
      }

      const createdCustomers: Array<{ id: string; name: string }> = [];
      let linkedOrderCount = 0;
      let updatedCustomerPhoneCount = 0;

      for (const normalizedName of Array.from(orderIdsByNormalizedName.keys())) {
        const orderIds = orderIdsByNormalizedName.get(normalizedName);
        if (!orderIds || orderIds.length === 0) {
          continue;
        }

        const originalName =
          originalNameByNormalizedName.get(normalizedName) ?? normalizedName;
        const importedPhone = phoneByNormalizedName.get(normalizedName) ?? null;
        let customer = customersByNormalizedName.get(normalizedName);

        if (!customer) {
          const { firstName, lastName } = splitCustomerName(originalName);
          let emailSuffix = 0;
          let email = buildImportedCustomerEmail(originalName, emailSuffix);

          while (usedEmails.has(email.toLowerCase())) {
            emailSuffix += 1;
            email = buildImportedCustomerEmail(originalName, emailSuffix);
          }

          const insertedCustomerResult = await client.query<ExistingCustomerRow>(
            `
              insert into customers (
                first_name,
                last_name,
                email,
                phone,
                notes,
                is_active
              )
              values ($1, $2, $3, $4, $5, true)
              returning id, first_name, last_name, email, phone
            `,
            [
              firstName,
              lastName,
              email,
              importedPhone,
              "Cliente criado automaticamente a partir de pedidos legados. Revisar cadastro e email.",
            ],
          );

          customer = insertedCustomerResult.rows[0];
          customersByNormalizedName.set(normalizedName, customer);
          usedEmails.add(customer.email.toLowerCase());
          createdCustomers.push({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`,
          });
        } else if (!customer.phone && importedPhone) {
          await client.query(
            `
              update customers
              set phone = $2, updated_at = now()
              where id = $1
            `,
            [customer.id, importedPhone],
          );

          customer.phone = importedPhone;
          updatedCustomerPhoneCount += 1;
        }

        await client.query(
          `
            update orders
            set customer_id = $2, updated_at = now()
            where id = any($1::uuid[])
          `,
          [orderIds, customer.id],
        );

        linkedOrderCount += orderIds.length;
      }

      await client.query("commit");

      return {
        createdCustomerCount: createdCustomers.length,
        updatedCustomerPhoneCount,
        linkedOrderCount,
        createdCustomers,
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
