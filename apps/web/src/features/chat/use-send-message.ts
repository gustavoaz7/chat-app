import { useState } from "react";
import type { ChatMessage } from "./chat-page";

export async function submitDraftMessage(
  sendMessage: (body: string) => Promise<ChatMessage>,
  body: string,
): Promise<ChatMessage> {
  const normalizedBody = body.trim();

  if (normalizedBody.length === 0) {
    throw new Error("Message body is required");
  }

  return sendMessage(normalizedBody);
}

export function useSendMessage(sendMessage: (body: string) => Promise<ChatMessage>) {
  const [isSending, setIsSending] = useState(false);

  return {
    isSending,
    async submitMessage(body: string) {
      setIsSending(true);

      try {
        return await submitDraftMessage(sendMessage, body);
      } finally {
        setIsSending(false);
      }
    },
  };
}
