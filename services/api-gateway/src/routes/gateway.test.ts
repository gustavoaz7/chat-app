import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../app";

describe("API Gateway", () => {
  it("proxies workspace creation to identity service", async () => {
    const identityClient = {
      createWorkspace: vi.fn(async (payload: { name: string; ownerUserId: string }) => ({
        id: "ws_123",
        ...payload,
      })),
    };
    const chatClient = {
      sendMessage: vi.fn(async (payload: {
        workspaceId: string;
        channelId: string;
        senderId: string;
        body: string;
      }) => ({
        id: "msg_123",
        ...payload,
      })),
    };
    const app = buildApp({ identityClient, chatClient });

    const response = await app.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: { name: "Acme", ownerUserId: "usr_123" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: "ws_123",
      name: "Acme",
      ownerUserId: "usr_123",
    });
    expect(identityClient.createWorkspace).toHaveBeenCalledWith({
      name: "Acme",
      ownerUserId: "usr_123",
    });

    await app.close();
  });

  it("proxies message sends to chat service", async () => {
    const identityClient = {
      createWorkspace: vi.fn(async (payload: { name: string; ownerUserId: string }) => ({
        id: "ws_123",
        ...payload,
      })),
    };
    const chatClient = {
      sendMessage: vi.fn(async (payload: {
        workspaceId: string;
        channelId: string;
        senderId: string;
        body: string;
      }) => ({
        id: "msg_123",
        ...payload,
      })),
    };
    const app = buildApp({ identityClient, chatClient });

    const response = await app.inject({
      method: "POST",
      url: "/api/messages",
      payload: {
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body: "hello gateway",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: "msg_123",
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "hello gateway",
    });
    expect(chatClient.sendMessage).toHaveBeenCalledWith({
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "hello gateway",
    });

    await app.close();
  });

  it("rejects invalid workspace payloads before proxying", async () => {
    const identityClient = {
      createWorkspace: vi.fn(),
    };
    const chatClient = {
      sendMessage: vi.fn(),
    };
    const app = buildApp({ identityClient, chatClient });

    const response = await app.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: { name: "", ownerUserId: "" },
    });

    expect(response.statusCode).toBe(400);
    expect(identityClient.createWorkspace).not.toHaveBeenCalled();

    await app.close();
  });

  it("rejects invalid message payloads before proxying", async () => {
    const identityClient = {
      createWorkspace: vi.fn(),
    };
    const chatClient = {
      sendMessage: vi.fn(),
    };
    const app = buildApp({ identityClient, chatClient });

    const response = await app.inject({
      method: "POST",
      url: "/api/messages",
      payload: {
        workspaceId: "",
        channelId: "",
        senderId: "",
        body: "",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(chatClient.sendMessage).not.toHaveBeenCalled();

    await app.close();
  });
});
