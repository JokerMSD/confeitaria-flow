import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import net from "net";
import { errorHandler } from "./middlewares/error-handler";
import { corsMiddleware } from "./middlewares/cors";
import { createSessionMiddleware } from "./auth/session";
import { loadEnvFile } from "./load-env";
import { CashTransactionsService } from "./services/cash-transactions.service";
import { assertRuntimeSchemaIsReady } from "./db/schema-guard";
import { applyPendingRuntimeMigrations } from "./db/runtime-migrations";

const app = express();
const httpServer = createServer(app);

loadEnvFile();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);
app.use(corsMiddleware);
app.use(createSessionMiddleware());

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

async function findAvailablePort(startPort: number, host: string) {
  let port = startPort;

  while (true) {
    const isAvailable = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();

      tester.once("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          resolve(false);
          return;
        }

        throw error;
      });

      tester.once("listening", () => {
        tester.close(() => resolve(true));
      });

      tester.listen(port, host);
    });

    if (isAvailable) {
      return port;
    }

    port += 1;
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  // await applyPendingRuntimeMigrations();
  // await assertRuntimeSchemaIsReady();
  await registerRoutes(httpServer, app);
  await new CashTransactionsService().reconcileOrderReceipts();

  app.use((err: any, _req: Request, _res: Response, next: NextFunction) => {
    console.error("Internal Server Error:", err);
    next(err);
  });
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const serveClient = process.env.SERVE_CLIENT !== "false";

  if (serveClient) {
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }
  } else {
    log("client serving disabled; running API-only mode", "express");
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const requestedPort = parseInt(process.env.PORT || "3000", 10);
  const host = "0.0.0.0";
  const port =
    process.env.NODE_ENV === "production"
      ? requestedPort
      : await findAvailablePort(requestedPort, host);

  if (process.env.NODE_ENV !== "production" && port !== requestedPort) {
    log(
      `port ${requestedPort} is busy, using port ${port} instead`,
      "express",
    );
  }

  httpServer.listen(
    {
      port,
      host,
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
