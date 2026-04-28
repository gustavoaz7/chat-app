import type { FastifyInstance } from "fastify";
import { CreateWorkspaceRequestSchema } from "@team-chat/contracts";
import type { WorkspaceServicePort } from "../domain/workspace-service";

export async function registerWorkspaceRoutes(
  app: FastifyInstance,
  workspaceService: WorkspaceServicePort,
) {
  app.post("/workspaces", async (request, reply) => {
    const payload = CreateWorkspaceRequestSchema.parse(request.body);
    const workspace = await workspaceService.createWorkspace(payload);

    return reply.code(201).send(workspace);
  });
}
