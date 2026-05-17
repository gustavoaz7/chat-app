import { GetMessagesQuerySchema, SendMessageRequestSchema } from "@team-chat/contracts";
import type { FastifyInstance } from "fastify";
import type { ChatClientPort } from "../clients/chat-client";

export function registerMessageRoutes(
  app: FastifyInstance,
  chatClient: ChatClientPort,
) {
  app.get("/api/messages", async (request) => {
    const parsedQuery = GetMessagesQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return {
        message: "Invalid message query",
        issues: parsedQuery.error.issues,
      };
    }

    return chatClient.listMessages(parsedQuery.data);
  });

  app.post("/api/messages", async (request, reply) => {
    const parsedPayload = SendMessageRequestSchema.safeParse(request.body);

    if (!parsedPayload.success) {
      return reply.code(400).send({
        message: "Invalid message payload",
        issues: parsedPayload.error.issues,
      });
    }

    const message = await chatClient.sendMessage(parsedPayload.data);

    return reply.code(201).send(message);
  });
}
