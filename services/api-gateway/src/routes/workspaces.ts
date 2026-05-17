import { CreateWorkspaceRequestSchema } from "@team-chat/contracts";
import type { FastifyInstance } from "fastify";
import type { IdentityClientPort } from "../clients/identity-client";

export function registerWorkspaceRoutes(
  app: FastifyInstance,
  identityClient: IdentityClientPort,
) {
  app.post("/api/workspaces", async (request, reply) => {
    const parsedPayload = CreateWorkspaceRequestSchema.safeParse(request.body);

    if (!parsedPayload.success) {
      return reply.code(400).send({
        message: "Invalid workspace payload",
        issues: parsedPayload.error.issues,
      });
    }

    const workspace = await identityClient.createWorkspace(parsedPayload.data);

    return reply.code(201).send(workspace);
  });
}
