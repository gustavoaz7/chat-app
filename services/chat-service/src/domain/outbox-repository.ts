export interface OutboxEventRecord {
  type: "chat.message.sent";
  payload: {
    messageId: string;
    workspaceId: string;
    channelId: string;
    senderId: string;
    body: string;
  };
}

export class OutboxRepository {
  private readonly events: OutboxEventRecord[] = [];

  async append(event: OutboxEventRecord): Promise<void> {
    this.events.push(event);
  }

  all(): OutboxEventRecord[] {
    return [...this.events];
  }
}
