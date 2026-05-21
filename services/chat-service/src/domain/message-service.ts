import type { MessageRecord, MessageRepositoryPort } from "./message-repository";

export interface MessageServicePort {
  sendMessage(input: Omit<MessageRecord, "id" | "createdAt">): Promise<MessageRecord>;
  listMessages(input: {
    workspaceId: string;
    channelId: string;
  }): Promise<MessageRecord[]>;
}

export class MessageService implements MessageServicePort {
  constructor(private readonly repository: MessageRepositoryPort) {}

  sendMessage(input: Omit<MessageRecord, "id" | "createdAt">) {
    return this.repository.writeMessageWithOutbox(input);
  }

  listMessages(input: { workspaceId: string; channelId: string }) {
    return this.repository.listByConversation(input);
  }
}
