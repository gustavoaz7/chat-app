import Fastify from "fastify";
import { ChannelService } from "./domain/channel-service";
import { InMemoryChannelRepository } from "./domain/channel-repository";
import { InMemoryMessageRepository } from "./domain/message-repository";
import { MessageService } from "./domain/message-service";
import { OutboxRepository } from "./domain/outbox-repository";
import type { ChannelServicePort } from "./domain/channel-service";
import type { MessageServicePort } from "./domain/message-service";
import { registerChannelRoutes } from "./routes/channels";
import { registerMessageRoutes } from "./routes/messages";

export function buildApp(deps?: {
  channelService: ChannelServicePort;
  messageService: MessageServicePort;
}) {
  const app = Fastify();
  const messageService = deps?.messageService;
  const channelService = deps?.channelService;

  if (deps !== undefined) {
    if (typeof messageService?.sendMessage !== "function") {
      throw new Error("messageService dependency is required when deps are provided");
    }

    if (typeof messageService.listMessages !== "function") {
      throw new Error("messageService.listMessages dependency is required when deps are provided");
    }

    if (typeof channelService?.createDefaultChannel !== "function") {
      throw new Error("channelService dependency is required when deps are provided");
    }
  }

  const outbox = new OutboxRepository();
  const defaultMessageService =
    messageService ?? new MessageService(new InMemoryMessageRepository(outbox));
  const defaultChannelService =
    channelService ?? new ChannelService(new InMemoryChannelRepository());

  registerMessageRoutes(app, defaultMessageService);
  registerChannelRoutes(app, defaultChannelService);

  return app;
}
