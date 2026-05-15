import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app";
import { MessageService } from "../domain/message-service";
import { OutboxRepository } from "../domain/outbox-repository";
import { registerMessageRoutes } from "./messages";

describe("POST /messages", () => {
  it("persists a message and records an outbox event", async () => {
    const outbox = new OutboxRepository();
    const messageService = new MessageService(outbox);
    const app = Fastify();
    await registerMessageRoutes(app, messageService);
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/messages",
      payload: {
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body: "hello world",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "hello world",
    });
    expect(outbox.all()).toEqual([
      {
        type: "chat.message.sent",
        payload: {
          messageId: response.json().id,
          workspaceId: "ws_123",
          channelId: "ch_123",
          senderId: "usr_123",
          body: "hello world",
        },
      },
    ]);

    await app.close();
  });

  it("records distinct outbox events for repeated sends", async () => {
    const app = buildApp();
    await app.ready();

    const firstResponse = await app.inject({
      method: "POST",
      url: "/messages",
      payload: {
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body: "first",
      },
    });

    const secondResponse = await app.inject({
      method: "POST",
      url: "/messages",
      payload: {
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body: "second",
      },
    });

    expect(firstResponse.statusCode).toBe(201);
    expect(secondResponse.statusCode).toBe(201);
    expect(firstResponse.json().id).not.toBe(secondResponse.json().id);

    await app.close();
  });

  it("returns a safe copy when reading outbox events", async () => {
    const outbox = new OutboxRepository();
    const messageService = new MessageService(outbox);

    await messageService.sendMessage({
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "hello world",
    });

    const snapshot = outbox.all();
    snapshot.push({
      type: "chat.message.sent",
      payload: {
        messageId: "msg_fake",
        workspaceId: "ws_fake",
        channelId: "ch_fake",
        senderId: "usr_fake",
        body: "mutated",
      },
    });

    expect(outbox.all()).toHaveLength(1);
  });
});
