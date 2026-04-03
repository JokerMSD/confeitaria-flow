import { loadEnvFile } from "../server/load-env";
import { CustomerOrderSyncService } from "../server/services/customer-order-sync.service";

loadEnvFile();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

async function main() {
  const service = new CustomerOrderSyncService();
  const summary = await service.syncMissingCustomersFromOrders();
  console.log(JSON.stringify(summary, null, 2));
}

await main();
