export interface SendMessagePayload {
  workspaceId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  body: string;
}

export interface ListMessagesPayload {
  workspaceId: string;
  channelId: string;
}

export interface ChatClientPort {
  sendMessage(payload: SendMessagePayload): Promise<unknown>;
  listMessages(payload: ListMessagesPayload): Promise<unknown>;
}
