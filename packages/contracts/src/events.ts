import { z } from "zod";

export const MessageSentEventSchema = z.object({
  type: z.literal("chat.message.sent"),
  messageId: z.string().min(1),
  workspaceId: z.string().min(1),
  channelId: z.string().min(1),
  senderId: z.string().min(1),
  body: z.string().min(1),
});
