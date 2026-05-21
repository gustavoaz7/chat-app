import type { FastifyInstance } from "fastify";
import { GetMessagesQuerySchema, SendMessageRequestSchema } from "@team-chat/contracts";
import type { MessageServicePort } from "../domain/message-service";

export function registerMessageRoutes(
  app: FastifyInstance,
  messageService: MessageServicePort,
) {
  app.get("/messages", async (request, reply) => {
    const parsedQuery = GetMessagesQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.code(400).send({
        message: "Invalid message query",
        issues: parsedQuery.error.issues,
      });
    }

    return messageService.listMessages(parsedQuery.data);
  });

  app.post("/messages", async (request, reply) => {
    const parsedPayload = SendMessageRequestSchema.safeParse(request.body);

    if (!parsedPayload.success) {
      return reply.code(400).send({
        message: "Invalid message payload",
        issues: parsedPayload.error.issues,
      });
    }

    const message = await messageService.sendMessage(parsedPayload.data);

    return reply.code(201).send(message);
  });
}
