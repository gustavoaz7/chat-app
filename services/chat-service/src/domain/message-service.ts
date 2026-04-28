import { OutboxRepository } from "./outbox-repository";

export interface MessageRecord {
  id: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  body: string;
}

export class MessageService {
  constructor(private readonly outbox: OutboxRepository) {}

  async sendMessage(input: Omit<MessageRecord, "id">): Promise<MessageRecord> {
    const message: MessageRecord = {
      id: "msg_local_1",
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
