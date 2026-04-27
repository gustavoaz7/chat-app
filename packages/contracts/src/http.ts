import { z } from "zod";

export const MessageBodySchema = z.string().min(1).max(4000);

export const SendMessageRequestSchema = z.object({
  workspaceId: z.string().min(1),
  channelId: z.string().min(1),
  senderId: z.string().min(1),
  body: MessageBodySchema,
});

export const CreateWorkspaceRequestSchema = z.object({
  name: z.string().min(1).max(120),
  ownerUserId: z.string().min(1),
});
