import { OutboxRepository } from "./outbox-repository";
import type { MessageRecord } from "./message-service";

export interface MessageRepositoryPort {
  writeMessageWithOutbox(
    input: Omit<MessageRecord, "id" | "createdAt">,
  ): Promise<MessageRecord>;
  listByConversation(input: {
    workspaceId: string;
    channelId: string;
  }): Promise<MessageRecord[]>;
}

export class InMemoryMessageRepository implements MessageRepositoryPort {
  private readonly messages: MessageRecord[] = [];

  constructor(private readonly outbox: OutboxRepository) {}

  async writeMessageWithOutbox(
    input: Omit<MessageRecord, "id" | "createdAt">,
  ): Promise<MessageRecord> {
    const message = {
      id: `msg_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      ...input,
    };

    this.messages.push(message);
    await this.outbox.append({
      type: "chat.message.sent",
      payload: {
        messageId: message.id,
        workspaceId: message.workspaceId,
        channelId: message.channelId,
        senderId: message.senderId,
        senderName: message.senderName,
        body: message.body,
      },
    });

    return { ...message };
  }

  async listByConversation(input: {
    workspaceId: string;
    channelId: string;
  }): Promise<MessageRecord[]> {
    return this.messages
      .filter(
        (message) =>
          message.workspaceId === input.workspaceId &&
          message.channelId === input.channelId,
      )
      .map((message) => ({ ...message }));
  }
}
