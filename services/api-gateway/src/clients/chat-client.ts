export interface SendMessagePayload {
  workspaceId: string;
  channelId: string;
  senderId: string;
  body: string;
}

export interface ChatClientPort {
  sendMessage(payload: SendMessagePayload): Promise<unknown>;
}
