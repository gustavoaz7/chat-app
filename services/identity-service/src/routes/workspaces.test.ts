import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app";
import { registerWorkspaceRoutes } from "./workspaces";

describe("POST /workspaces", () => {
  it("creates a workspace for an owner", async () => {
    const app = buildApp();
    await app.ready();

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

    await app.close();
  });

  it("uses the injected workspace service", async () => {
    const app = Fastify();
    await registerWorkspaceRoutes(app, {
      async createWorkspace(input) {
        return {
          id: "ws_injected",
          name: input.name,
          ownerUserId: input.ownerUserId,
        };
      },
    });
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/workspaces",
      payload: {
        name: "Injected",
        ownerUserId: "usr_injected",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      id: "ws_injected",
      name: "Injected",
      ownerUserId: "usr_injected",
    });

    await app.close();
  });
});
