import { Client } from "pg";
import { loadEnvFile } from "../server/load-env";

loadEnvFile();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

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
    return {
      firstName: "Cliente",
      lastName: "Importado",
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "Importado",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
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

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

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

      if (!normalized) {
        continue;
      }

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
    const linkedOrders: string[] = [];
    const updatedPhones: string[] = [];

    for (const [normalizedName, orderIds] of orderIdsByNormalizedName.entries()) {
      const originalName = originalNameByNormalizedName.get(normalizedName) ?? normalizedName;
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
            set
              phone = $2,
              updated_at = now()
            where id = $1
          `,
          [customer.id, importedPhone],
        );

        customer.phone = importedPhone;
        updatedPhones.push(customer.id);
      }

      await client.query(
        `
          update orders
          set
            customer_id = $2,
            updated_at = now()
          where id = any($1::uuid[])
        `,
        [orderIds, customer.id],
      );

      linkedOrders.push(...orderIds);
    }

    await client.query("commit");

    console.log(
      JSON.stringify(
        {
          createdCustomerCount: createdCustomers.length,
          updatedCustomerPhoneCount: updatedPhones.length,
          linkedOrderCount: linkedOrders.length,
          createdCustomers,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

await main();
