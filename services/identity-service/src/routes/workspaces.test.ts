import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app";
import type { WorkspaceServicePort } from "../domain/workspace-service";
import { registerWorkspaceRoutes } from "./workspaces";

describe("POST /workspaces", () => {
  it("creates a workspace for an owner", async () => {
    const app = buildApp({
      workspaceService: {
        async createWorkspace(input) {
          return {
            id: "ws_created",
            name: input.name,
            ownerUserId: input.ownerUserId,
            defaultChannelId: "ch_general",
          };
        },
      },
    });
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
      id: "ws_created",
      name: "Acme",
      ownerUserId: "usr_123",
      defaultChannelId: "ch_general",
    });

    await app.close();
  });

  it("returns a 400 response for malformed workspace input", async () => {
    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/workspaces",
      payload: {
        name: "",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      message: "Invalid workspace payload",
    });
    expect(response.json().issues).toBeInstanceOf(Array);

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
          defaultChannelId: "ch_injected",
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
      defaultChannelId: "ch_injected",
    });

    await app.close();
  });

  it("uses the injected workspace service through buildApp", async () => {
    const workspaceService: WorkspaceServicePort = {
      async createWorkspace(input: {
        name: string;
        ownerUserId: string;
      }) {
        return {
          id: "ws_from_app_deps",
          name: input.name,
          ownerUserId: input.ownerUserId,
          defaultChannelId: "ch_from_app_deps",
        };
      },
    };

    const app = buildApp({
      workspaceService,
    });
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/workspaces",
      payload: {
        name: "Composed",
        ownerUserId: "usr_app",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      id: "ws_from_app_deps",
      name: "Composed",
      ownerUserId: "usr_app",
      defaultChannelId: "ch_from_app_deps",
    });

    await app.close();
  });

  it("fails fast when deps are provided without a workspace service", () => {
    expect(() => buildApp({} as { workspaceService: WorkspaceServicePort })).toThrow(
      "workspaceService",
    );
  });
});
