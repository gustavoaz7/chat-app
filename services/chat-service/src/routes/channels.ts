import { CreateDefaultChannelRequestSchema } from "@team-chat/contracts";
import type { FastifyInstance } from "fastify";
import type { ChannelServicePort } from "../domain/channel-service";

export function registerChannelRoutes(
  app: FastifyInstance,
  channelService: ChannelServicePort,
) {
  app.post("/channels/default", async (request, reply) => {
    const payload = CreateDefaultChannelRequestSchema.parse(request.body);
    const channel = await channelService.createDefaultChannel(payload);

    return reply.code(201).send(channel);
  });
}
