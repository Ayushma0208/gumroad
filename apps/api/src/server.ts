import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Lumen API listening on http://localhost:${env.PORT}`);
});

void prisma.$connect().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown error";
  console.warn(`Database not connected yet: ${message}`);
});
