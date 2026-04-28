import { describe, expect, it } from "vitest";
import { buildApp } from "../app";

describe("POST /messages", () => {
  it("persists a message and records an outbox event", async () => {
    const app = buildApp();
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

    await app.close();
  });
});
