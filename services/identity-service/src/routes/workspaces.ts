import type { FastifyInstance } from "fastify";
import { CreateWorkspaceRequestSchema } from "@team-chat/contracts";
import type { WorkspaceServicePort } from "../domain/workspace-service";

export async function registerWorkspaceRoutes(
  app: FastifyInstance,
  workspaceService: WorkspaceServicePort,
) {
  app.post("/workspaces", async (request, reply) => {
    const parsedPayload = CreateWorkspaceRequestSchema.safeParse(request.body);

    if (!parsedPayload.success) {
      return reply.code(400).send({
        message: "Invalid workspace payload",
        issues: parsedPayload.error.issues,
      });
    }

    const payload = parsedPayload.data;
    const workspace = await workspaceService.createWorkspace(payload);

    return reply.code(201).send(workspace);
  });
}
