import type { FastifyInstance } from "fastify";
import { GetMessagesQuerySchema, SendMessageRequestSchema } from "@team-chat/contracts";
import type { MessageServicePort } from "../domain/message-service";

export function registerMessageRoutes(
  app: FastifyInstance,
  messageService: MessageServicePort,
) {
  app.get("/messages", async (request) => {
    const query = GetMessagesQuerySchema.parse(request.query);
    return messageService.listMessages(query);
  });

  app.post("/messages", async (request, reply) => {
    const payload = SendMessageRequestSchema.parse(request.body);
    const message = await messageService.sendMessage(payload);

    return reply.code(201).send(message);
  });
}
