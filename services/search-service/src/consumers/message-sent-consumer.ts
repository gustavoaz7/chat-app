export interface MessageSentEvent {
  type: "chat.message.sent";
  messageId: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  body: string;
}

export function createSearchDocumentFromMessageSent(event: MessageSentEvent) {
  return {
    id: event.messageId,
    workspaceId: event.workspaceId,
    channelId: event.channelId,
    senderId: event.senderId,
    body: event.body,
  };
}
