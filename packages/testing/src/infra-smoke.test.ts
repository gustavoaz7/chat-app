import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("local infrastructure", () => {
  it("defines the local infrastructure contract", () => {
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const env = readFileSync("infra/.env.example", "utf8");

    expect(compose).toContain("postgres:");
    expect(compose).toContain("redis:");
    expect(compose).toContain("nats:");
    expect(compose).toContain("POSTGRES_DB: team_chat");
    expect(compose).toContain('"5432:5432"');
    expect(compose).toContain('"6379:6379"');
    expect(compose).toContain('"4222:4222"');
    expect(compose).toContain('"8222:8222"');
    expect(compose).toContain('command: ["-js"]');

    expect(env).toContain(
      "POSTGRES_URL=postgresql://chat:chat@localhost:5432/team_chat",
    );
    expect(env).toContain("REDIS_URL=redis://localhost:6379");
    expect(env).toContain("NATS_URL=nats://localhost:4222");
  });
});
