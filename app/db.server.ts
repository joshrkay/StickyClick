import { PrismaClient } from "@prisma/client";

const DATABASE_URL_ENV_KEY = "DATABASE_URL";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient() {
  const databaseUrl = process.env[DATABASE_URL_ENV_KEY];

  if (!databaseUrl) {
    throw new Error(
      `Missing required environment variable ${DATABASE_URL_ENV_KEY}. Set a valid PostgreSQL connection string (for Vercel, add it under Project Settings > Environment Variables) before starting the app.`,
    );
  }

  console.info("[db] Initializing Prisma client");
  return new PrismaClient();
}

if (process.env.NODE_ENV !== "production" && !global.prismaGlobal) {
  global.prismaGlobal = createPrismaClient();
}

const prisma = global.prismaGlobal ?? createPrismaClient();

export default prisma;
