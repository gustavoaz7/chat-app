import { describe, expect, it } from "vitest";
import { buildApp } from "../app";

describe("POST /workspaces", () => {
  it("creates a workspace for an owner", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/workspaces",
      payload: {
        name: "Acme",
        ownerUserId: "usr_123",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      name: "Acme",
      ownerUserId: "usr_123",
    });
  });
});
