export interface MessageSentRealtimeEvent {
  type: "chat.message.sent";
  messageId: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  body: string;
}

type Listener = (event: MessageSentRealtimeEvent) => void;

export class MessageBroadcast {
  private readonly listeners = new Map<string, Listener[]>();

  subscribe(channelId: string, listener: Listener): () => void {
    const current = this.listeners.get(channelId) ?? [];
    this.listeners.set(channelId, [...current, listener]);

    return () => {
      const next = (this.listeners.get(channelId) ?? []).filter((entry) => entry !== listener);

      if (next.length === 0) {
        this.listeners.delete(channelId);
        return;
      }

      this.listeners.set(channelId, next);
    };
  }

  publish(channelId: string, event: MessageSentRealtimeEvent): void {
    for (const listener of [...(this.listeners.get(channelId) ?? [])]) {
      listener(event);
    }
  }
}
