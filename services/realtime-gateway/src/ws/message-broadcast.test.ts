import { describe, expect, it } from "vitest";
import { MessageBroadcast } from "./message-broadcast";

describe("MessageBroadcast", () => {
  it("delivers a message event to all subscribers of a channel", () => {
    const received: string[] = [];
    const broadcaster = new MessageBroadcast();

    broadcaster.subscribe("ch_123", (event) => {
      received.push(event.body);
    });
    broadcaster.subscribe("ch_123", (event) => {
      received.push(`copy:${event.body}`);
    });

    broadcaster.publish("ch_123", {
      type: "chat.message.sent",
      messageId: "msg_123",
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "hello realtime",
    });

    expect(received).toEqual(["hello realtime", "copy:hello realtime"]);
  });

  it("allows subscribers to unsubscribe cleanly", () => {
    const received: string[] = [];
    const broadcaster = new MessageBroadcast();
    const unsubscribe = broadcaster.subscribe("ch_123", (event) => {
      received.push(event.body);
    });

    unsubscribe();
    broadcaster.publish("ch_123", {
      type: "chat.message.sent",
      messageId: "msg_123",
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "ignored",
    });

    expect(received).toEqual([]);
  });
});
