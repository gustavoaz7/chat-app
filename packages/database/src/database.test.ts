import { describe, expect, it } from "vitest";
import { buildDatabaseUrl, defaultChannelName } from "./index";

describe("database helpers", () => {
  it("builds a postgres connection string from explicit env values", () => {
    expect(
      buildDatabaseUrl({
        host: "localhost",
        port: 5432,
        database: "team_chat",
        user: "postgres",
        password: "postgres",
      }),
    ).toBe("postgresql://postgres:postgres@localhost:5432/team_chat");
  });

  it("encodes reserved URI characters in credentials", () => {
    expect(
      buildDatabaseUrl({
        host: "localhost",
        port: 5432,
        database: "team/chat",
        user: "user@team",
        password: "p@ss:/?#",
      }),
    ).toBe(
      "postgresql://user%40team:p%40ss%3A%2F%3F%23@localhost:5432/team%2Fchat",
    );
  });

  it("exports the shared default channel name", () => {
    expect(defaultChannelName).toBe("general");
  });
});
