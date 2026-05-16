export interface MessageSentEvent {
  type: "chat.message.sent";
  messageId: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  body: string;
}

export function createNotificationFromMessageSent(event: MessageSentEvent) {
  return {
    workspaceId: event.workspaceId,
    channelId: event.channelId,
    recipientStrategy: "mentions-only" as const,
    sourceMessageId: event.messageId,
  };
}
