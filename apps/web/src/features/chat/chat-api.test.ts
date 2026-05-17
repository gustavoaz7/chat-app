import { describe, expect, it, vi } from "vitest";
import { createChatApi } from "./chat-api";

describe("createChatApi", () => {
  it("loads durable message history", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => [{ id: "msg_1", senderName: "Ava", body: "Morning team" }],
    }));

    const api = createChatApi(fetchImpl as typeof fetch);
    const messages = await api.loadMessages({
      workspaceId: "ws_1",
      channelId: "ch_1",
    });

    expect(fetchImpl).toHaveBeenCalledWith("/api/messages?workspaceId=ws_1&channelId=ch_1");
    expect(messages).toHaveLength(1);
  });
});
