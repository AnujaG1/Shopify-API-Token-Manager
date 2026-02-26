import { PrismaClient } from "@prisma/client";

declare global {
  var __db__: PrismaClient;
}

if (process.env.NODE_ENV !== "production") {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
}

const prisma = global.__db__ ?? new PrismaClient();

export { prisma };
