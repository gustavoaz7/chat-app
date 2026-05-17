import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../app";

describe("POST /channels/default", () => {
  it("creates a default channel", async () => {
    const app = buildApp({
      channelService: {
        createDefaultChannel: vi.fn(async () => ({
          id: "ch_1",
          workspaceId: "ws_1",
          name: "general",
          kind: "channel",
        })),
      },
      messageService: {
        sendMessage: vi.fn(async () => {
          throw new Error("not used");
        }),
        listMessages: vi.fn(async () => []),
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/channels/default",
      payload: { workspaceId: "ws_1", name: "general" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      id: "ch_1",
      workspaceId: "ws_1",
    });
  });
});
