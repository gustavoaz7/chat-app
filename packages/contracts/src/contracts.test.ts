import { describe, expect, it } from "vitest";
import { MessageSentEventSchema, SendMessageRequestSchema } from "./index";

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
});
