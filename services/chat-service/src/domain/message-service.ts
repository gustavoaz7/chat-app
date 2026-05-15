import { OutboxRepository } from "./outbox-repository";

export interface MessageRecord {
  id: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  body: string;
}

export interface MessageServicePort {
  sendMessage(input: Omit<MessageRecord, "id">): Promise<MessageRecord>;
}

export class MessageService implements MessageServicePort {
  private nextMessageId = 1;

  constructor(private readonly outbox: OutboxRepository) {}

  async sendMessage(input: Omit<MessageRecord, "id">): Promise<MessageRecord> {
    const message: MessageRecord = {
      id: `msg_local_${this.nextMessageId++}`,
      ...input,
    };

    await this.outbox.append({
      type: "chat.message.sent",
      payload: {
        messageId: message.id,
        workspaceId: message.workspaceId,
        channelId: message.channelId,
        senderId: message.senderId,
        body: message.body,
      },
    });

    return message;
  }
}
