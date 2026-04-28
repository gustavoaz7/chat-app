import { describe, expect, it } from "vitest";
import {
  BaseServiceEnvSchema,
  NatsEnvSchema,
  PostgresEnvSchema,
  RedisEnvSchema,
} from "./index";

describe("config env schemas", () => {
  it("defaults NODE_ENV to development", () => {
    const parsed = BaseServiceEnvSchema.parse({
      PORT: 3000,
    });

    expect(parsed.NODE_ENV).toBe("development");
  });

  it("coerces PORT from string to number", () => {
    const parsed = BaseServiceEnvSchema.parse({
      PORT: "3000",
    });

    expect(parsed.PORT).toBe(3000);
  });

  it("accepts valid infrastructure URLs", () => {
    const postgres = PostgresEnvSchema.parse({
      POSTGRES_URL: "https://postgres.internal.example",
    });
    const redis = RedisEnvSchema.parse({
      REDIS_URL: "https://redis.internal.example",
    });
    const nats = NatsEnvSchema.parse({
      NATS_URL: "https://nats.internal.example",
    });

    expect(postgres.POSTGRES_URL).toBe("https://postgres.internal.example");
    expect(redis.REDIS_URL).toBe("https://redis.internal.example");
    expect(nats.NATS_URL).toBe("https://nats.internal.example");
  });
});
