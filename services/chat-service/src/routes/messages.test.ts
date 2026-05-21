import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app";
import { InMemoryMessageRepository } from "../domain/message-repository";
import { MessageService } from "../domain/message-service";
import { OutboxRepository } from "../domain/outbox-repository";
import { registerMessageRoutes } from "./messages";

describe("POST /messages", () => {
  it("persists a message and records an outbox event", async () => {
    const outbox = new OutboxRepository();
    const messageService = new MessageService(new InMemoryMessageRepository(outbox));
    const app = Fastify();
    registerMessageRoutes(app, messageService);
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/messages",
      payload: {
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        senderName: "Avery",
        body: "hello world",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      senderName: "Avery",
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
          senderName: "Avery",
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
        senderName: "Avery",
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
        senderName: "Avery",
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
    const messageService = new MessageService(new InMemoryMessageRepository(outbox));

    await messageService.sendMessage({
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      senderName: "Avery",
      body: "hello world",
    });

    const snapshot = outbox.all();
    snapshot[0]!.payload.body = "mutated";
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

    expect(outbox.all()).toEqual([
      {
        type: "chat.message.sent",
        payload: {
          messageId: expect.any(String),
          workspaceId: "ws_123",
          channelId: "ch_123",
          senderId: "usr_123",
          senderName: "Avery",
          body: "hello world",
        },
      },
    ]);
  });

  it("lists message history for one conversation", async () => {
    const app = buildApp();
    await app.ready();

    await app.inject({
      method: "POST",
      url: "/messages",
      payload: {
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        senderName: "Avery",
        body: "history entry",
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/messages?workspaceId=ws_123&channelId=ch_123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      expect.objectContaining({
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderName: "Avery",
        body: "history entry",
      }),
    ]);

    await app.close();
  });

  it("returns 400 for invalid message history queries", async () => {
    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/messages?workspaceId=&channelId=",
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });
});
