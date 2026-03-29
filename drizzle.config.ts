import { loadEnvFile } from "./server/load-env";

loadEnvFile();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default {
  out: "./migrations",
  schema: "./shared/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
