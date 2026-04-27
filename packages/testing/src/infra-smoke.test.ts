import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("local infrastructure", () => {
  it("defines postgres, redis, and nats in docker compose", () => {
    const compose = readFileSync("infra/docker-compose.yml", "utf8");

    expect(compose).toContain("postgres:");
    expect(compose).toContain("redis:");
    expect(compose).toContain("nats:");
  });
});
