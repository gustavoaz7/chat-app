import Fastify from "fastify";
import { MessageService } from "./domain/message-service";
import { OutboxRepository } from "./domain/outbox-repository";
import { registerMessageRoutes } from "./routes/messages";

export function buildApp() {
  const app = Fastify();
  const outbox = new OutboxRepository();
  const messageService = new MessageService(outbox);

  void registerMessageRoutes(app, messageService);

  return app;
}
