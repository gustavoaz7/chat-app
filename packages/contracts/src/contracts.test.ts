import { describe, expect, it } from "vitest";
import {
  CreateWorkspaceRequestSchema,
  MessageSentEventSchema,
  SendMessageRequestSchema,
} from "./index";

describe("shared contracts", () => {
  it("exposes a send-message request schema", () => {
    const parsed = SendMessageRequestSchema.parse({
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "hello",
    });

    expect(parsed.body).toBe("hello");
  });

  it("exposes a create-workspace request schema", () => {
    const parsed = CreateWorkspaceRequestSchema.parse({
      name: "Engineering",
      ownerUserId: "usr_123",
    });

    expect(parsed.name).toBe("Engineering");
  });

  it("exposes a message-sent event schema", () => {
    const parsed = MessageSentEventSchema.parse({
      type: "chat.message.sent",
      messageId: "msg_123",
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "hello",
    });

    expect(parsed.type).toBe("chat.message.sent");
  });

  it("enforces the shared message-body max for requests and events", () => {
    const body = "a".repeat(4001);

    expect(() =>
      SendMessageRequestSchema.parse({
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body,
      }),
    ).toThrow();

    expect(() =>
      MessageSentEventSchema.parse({
        type: "chat.message.sent",
        messageId: "msg_123",
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body,
      }),
    ).toThrow();
  });
});
