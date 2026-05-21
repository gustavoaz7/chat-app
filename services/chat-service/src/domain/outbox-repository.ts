export interface OutboxEventRecord {
  type: "chat.message.sent";
  payload: {
    messageId: string;
    workspaceId: string;
    channelId: string;
    senderId: string;
    senderName: string;
    body: string;
  };
}

export interface OutboxWriterPort {
  append(event: OutboxEventRecord): Promise<void>;
}

export class OutboxRepository {
  private readonly events: OutboxEventRecord[] = [];

  async append(event: OutboxEventRecord): Promise<void> {
    this.events.push(cloneEvent(event));
  }

  all(): OutboxEventRecord[] {
    return this.events.map(cloneEvent);
  }
}

function cloneEvent(event: OutboxEventRecord): OutboxEventRecord {
  return {
    ...event,
    payload: { ...event.payload },
  };
}
