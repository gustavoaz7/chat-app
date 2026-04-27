import { z } from "zod";

export const BaseServiceEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive(),
});

export const PostgresEnvSchema = z.object({
  POSTGRES_URL: z.string().url(),
});

export const RedisEnvSchema = z.object({
  REDIS_URL: z.string().url(),
});

export const NatsEnvSchema = z.object({
  NATS_URL: z.string().url(),
});
