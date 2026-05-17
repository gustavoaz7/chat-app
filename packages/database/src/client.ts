import { PrismaClient } from "@prisma/client";

let prismaSingleton: PrismaClient | undefined;

export function createPrismaClient() {
  return new PrismaClient();
}

export function getPrismaClient() {
  prismaSingleton ??= createPrismaClient();
  return prismaSingleton;
}
