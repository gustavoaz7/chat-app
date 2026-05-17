import { describe, expect, it } from "vitest";
import { createSearchDocumentFromMessageSent } from "./message-sent-consumer";

describe("search consumer", () => {
  it("projects a message event into a search document", () => {
    expect(
      createSearchDocumentFromMessageSent({
        type: "chat.message.sent",
        messageId: "msg_123",
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body: "hello",
      }),
    ).toMatchObject({
      id: "msg_123",
      workspaceId: "ws_123",
      body: "hello",
    });
  });
});
