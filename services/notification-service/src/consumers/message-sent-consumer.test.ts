import { describe, expect, it } from "vitest";
import { createNotificationFromMessageSent } from "./message-sent-consumer";

describe("notification consumer", () => {
  it("turns a message-sent event into a notification candidate", () => {
    expect(
      createNotificationFromMessageSent({
        type: "chat.message.sent",
        messageId: "msg_123",
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body: "hello",
      }),
    ).toMatchObject({
      workspaceId: "ws_123",
      channelId: "ch_123",
      sourceMessageId: "msg_123",
    });
  });
});
