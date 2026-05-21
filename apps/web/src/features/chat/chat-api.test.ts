import { describe, expect, it, vi } from "vitest";
import { createChatApi } from "./chat-api";

describe("createChatApi", () => {
  it("loads durable message history", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => [{ id: "msg_1", senderName: "Ava", body: "Morning team" }],
    }));

    const api = createChatApi(fetchImpl as unknown as typeof fetch);
    const messages = await api.loadMessages({
      workspaceId: "ws_1",
      channelId: "ch_1",
    });

    expect(fetchImpl).toHaveBeenCalledWith("/api/messages?workspaceId=ws_1&channelId=ch_1");
    expect(messages).toHaveLength(1);
  });

  it("falls back to scoped local storage when loading messages fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const storage = window.localStorage;
    storage.clear();
    storage.setItem(
      "team-chat-messages:ws_1:ch_1",
      JSON.stringify([{ id: "msg_local", senderName: "Ava", body: "Cached hello" }]),
    );

    const api = createChatApi(fetchImpl as unknown as typeof fetch, storage);
    const messages = await api.loadMessages({
      workspaceId: "ws_1",
      channelId: "ch_1",
    });

    expect(fetchImpl).toHaveBeenCalledWith("/api/messages?workspaceId=ws_1&channelId=ch_1");
    expect(messages).toEqual([{ id: "msg_local", senderName: "Ava", body: "Cached hello" }]);
  });

  it("appends sent messages to scoped local storage when the API send fails", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }));
    const storage = window.localStorage;
    storage.clear();
    storage.setItem(
      "team-chat-messages:ws_1:ch_1",
      JSON.stringify([{ id: "msg_existing", senderName: "Ava", body: "Existing" }]),
    );

    const api = createChatApi(fetchImpl as unknown as typeof fetch, storage);
    const message = await api.sendMessage({
      workspaceId: "ws_1",
      channelId: "ch_1",
      senderId: "user_1",
      senderName: "You",
      body: "Fallback send",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/messages",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(message).toMatchObject({
      senderName: "You",
      body: "Fallback send",
    });
    expect(
      JSON.parse(storage.getItem("team-chat-messages:ws_1:ch_1") ?? "[]"),
    ).toEqual([
      { id: "msg_existing", senderName: "Ava", body: "Existing" },
      expect.objectContaining({
        senderName: "You",
        body: "Fallback send",
      }),
    ]);
  });
});
