import { describe, expect, it, vi } from "vitest";
import { MessageService } from "./message-service";

describe("MessageService", () => {
  it("persists a message and matching outbox event through one repository transaction seam", async () => {
    const writeMessageWithOutbox = vi.fn(async (input) => ({
      id: "msg_1",
      createdAt: "2026-05-17T10:00:00.000Z",
      ...input,
    }));

    const service = new MessageService({
      writeMessageWithOutbox,
      listByConversation: vi.fn(async () => []),
    });

    const message = await service.sendMessage({
      workspaceId: "ws_1",
      channelId: "ch_1",
      senderId: "user_1",
      senderName: "You",
      body: "hello team",
    });

    expect(writeMessageWithOutbox).toHaveBeenCalledOnce();
    expect(message.senderName).toBe("You");
  });
});
