import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function parseEnvFile(contents: string) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");

        return [
          line.slice(0, separatorIndex),
          line.slice(separatorIndex + 1),
        ] as const;
      }),
  );
}

describe("local infrastructure", () => {
  it("defines the local infrastructure contract", () => {
    const compose = readFileSync(
      join(workspaceRoot, "infra", "docker-compose.yml"),
      "utf8",
    );
    const env = parseEnvFile(
      readFileSync(join(workspaceRoot, "infra", ".env.example"), "utf8"),
    );
    const exposedPorts = Array.from(
      compose.matchAll(/-\s*"(?<host>\d+):(?<container>\d+)"/g),
      (match) => ({
        host: Number(match.groups?.host),
        container: Number(match.groups?.container),
      }),
    );

    expect(compose).toMatch(/^\s*postgres:\s*$/m);
    expect(compose).toMatch(/^\s*redis:\s*$/m);
    expect(compose).toMatch(/^\s*nats:\s*$/m);
    expect(compose).toMatch(/POSTGRES_DB:\s*team_chat/);
    expect(exposedPorts).toEqual(
      expect.arrayContaining([
        { host: 5432, container: 5432 },
        { host: 6379, container: 6379 },
        { host: 4222, container: 4222 },
        { host: 8222, container: 8222 },
      ]),
    );
    expect(compose).toMatch(/command:\s*\[\s*"-js"\s*\]/);

    expect(env).toMatchObject({
      POSTGRES_URL: "postgresql://chat:chat@localhost:5432/team_chat",
      REDIS_URL: "redis://localhost:6379",
      NATS_URL: "nats://localhost:4222",
    });
    expect(Object.keys(env)).toEqual(
      expect.arrayContaining([
        "POSTGRES_URL",
        "REDIS_URL",
        "NATS_URL",
      ]),
    );
  });
});
