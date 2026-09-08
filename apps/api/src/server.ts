import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";
import {
  startEmailWorker,
  stopEmailWorker,
} from "./modules/email/email.service";
import { logEvent } from "./utils/logger";

const app = createApp();

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Lumen API listening on http://0.0.0.0:${env.PORT}`);
  if (env.NODE_ENV !== "test") {
    startEmailWorker(env.EMAIL_WORKER_INTERVAL_MS);
  }
});

void prisma.$connect().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown error";
  console.warn(`Database not connected yet: ${message}`);
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logEvent("server_shutdown", { signal });
  stopEmailWorker();
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore disconnect errors during shutdown */
  }
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
