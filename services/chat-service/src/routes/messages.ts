import type { FastifyInstance } from "fastify";
import { SendMessageRequestSchema } from "@team-chat/contracts";
import { MessageService } from "../domain/message-service";
import { OutboxRepository } from "../domain/outbox-repository";

export async function registerMessageRoutes(app: FastifyInstance) {
  const outbox = new OutboxRepository();
  const messageService = new MessageService(outbox);

  app.post("/messages", async (request, reply) => {
    const payload = SendMessageRequestSchema.parse(request.body);
    const message = await messageService.sendMessage(payload);

    return reply.code(201).send(message);
  });
}
