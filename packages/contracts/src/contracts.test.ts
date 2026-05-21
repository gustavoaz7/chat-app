import { describe, expect, it } from "vitest";
import {
  CreateDefaultChannelRequestSchema,
  CreateWorkspaceRequestSchema,
  GetMessagesQuerySchema,
  MessageSentEventSchema,
  SendMessageRequestSchema,
} from "@team-chat/contracts";

describe("shared contracts", () => {
  it("exposes a send-message request schema", () => {
    const parsed = SendMessageRequestSchema.parse({
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      senderName: "Avery",
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

  it("accepts default channel provisioning payloads", () => {
    expect(
      CreateDefaultChannelRequestSchema.parse({
        workspaceId: "ws_1",
        name: "general",
      }),
    ).toEqual({
      workspaceId: "ws_1",
      name: "general",
    });
  });

  it("parses message history queries", () => {
    expect(
      GetMessagesQuerySchema.parse({
        workspaceId: "ws_1",
        channelId: "ch_1",
      }),
    ).toEqual({
      workspaceId: "ws_1",
      channelId: "ch_1",
    });
  });

  it("exposes a message-sent event schema", () => {
    const parsed = MessageSentEventSchema.parse({
      type: "chat.message.sent",
      messageId: "msg_123",
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      senderName: "Avery",
      body: "hello",
    });

    expect(parsed.type).toBe("chat.message.sent");
    expect(parsed.senderName).toBe("Avery");
  });

  it("enforces the shared message-body max for requests and events", () => {
    const body = "a".repeat(4001);

    expect(() =>
      SendMessageRequestSchema.parse({
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        senderName: "Avery",
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
        senderName: "Avery",
        body,
      }),
    ).toThrow();
  });

  it("trims and bounds sender names on send-message requests", () => {
    expect(
      SendMessageRequestSchema.parse({
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        senderName: "  Avery  ",
        body: "hello",
      }).senderName,
    ).toBe("Avery");

    expect(() =>
      SendMessageRequestSchema.parse({
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        senderName: "   ",
        body: "hello",
      }),
    ).toThrow();

    expect(() =>
      SendMessageRequestSchema.parse({
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        senderName: "a".repeat(121),
        body: "hello",
      }),
    ).toThrow();
  });
});
