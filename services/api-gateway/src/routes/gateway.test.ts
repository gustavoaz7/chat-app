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
      listMessages: vi.fn(async () => []),
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
        senderName: string;
        body: string;
      }) => ({
        id: "msg_123",
        ...payload,
      })),
      listMessages: vi.fn(async () => []),
    };
    const app = buildApp({ identityClient, chatClient });

    const response = await app.inject({
      method: "POST",
      url: "/api/messages",
      payload: {
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        senderName: "Avery",
        body: "hello gateway",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: "msg_123",
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      senderName: "Avery",
      body: "hello gateway",
    });
    expect(chatClient.sendMessage).toHaveBeenCalledWith({
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      senderName: "Avery",
      body: "hello gateway",
    });

    await app.close();
  });

  it("proxies message history requests to the chat client", async () => {
    const listMessages = vi.fn(async () => [
      {
        id: "msg_1",
        workspaceId: "ws_1",
        channelId: "ch_1",
        senderId: "user_1",
        senderName: "Ava",
        body: "Morning team",
        createdAt: "2026-05-17T10:00:00.000Z",
      },
    ]);
    const identityClient = {
      createWorkspace: vi.fn(async () => ({ id: "ws_1", defaultChannelId: "ch_1" })),
    };
    const chatClient = {
      sendMessage: vi.fn(async () => ({ id: "msg_2" })),
      listMessages,
    };
    const app = buildApp({ identityClient, chatClient });

    const response = await app.inject({
      method: "GET",
      url: "/api/messages?workspaceId=ws_1&channelId=ch_1",
    });

    expect(response.statusCode).toBe(200);
    expect(listMessages).toHaveBeenCalledWith({
      workspaceId: "ws_1",
      channelId: "ch_1",
    });
    expect(response.json()).toHaveLength(1);

    await app.close();
  });

  it("rejects invalid workspace payloads before proxying", async () => {
    const identityClient = {
      createWorkspace: vi.fn(),
    };
    const chatClient = {
      sendMessage: vi.fn(),
      listMessages: vi.fn(),
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
      listMessages: vi.fn(),
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
