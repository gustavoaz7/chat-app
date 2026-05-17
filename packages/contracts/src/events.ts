import { z } from "zod";
import { MessageBodySchema } from "./http";

export const MessageSentEventSchema = z.object({
  type: z.literal("chat.message.sent"),
  messageId: z.string().min(1),
  workspaceId: z.string().min(1),
  channelId: z.string().min(1),
  senderId: z.string().min(1),
  body: MessageBodySchema,
});
