import { CreateDefaultChannelRequestSchema } from "@team-chat/contracts";
import type { FastifyInstance } from "fastify";
import type { ChannelServicePort } from "../domain/channel-service";

export function registerChannelRoutes(
  app: FastifyInstance,
  channelService: ChannelServicePort,
) {
  app.post("/channels/default", async (request, reply) => {
    const parsedPayload = CreateDefaultChannelRequestSchema.safeParse(request.body);

    if (!parsedPayload.success) {
      return reply.code(400).send({
        message: "Invalid default channel payload",
        issues: parsedPayload.error.issues,
      });
    }

    const channel = await channelService.createDefaultChannel(parsedPayload.data);

    return reply.code(201).send(channel);
  });
}
