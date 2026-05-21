import { OutboxRepository } from "./outbox-repository";

export interface MessageRecord {
  id: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

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
    try {
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
    } catch (error) {
      const index = this.messages.findIndex((candidate) => candidate.id === message.id);

      if (index >= 0) {
        this.messages.splice(index, 1);
      }

      throw error;
    }

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
