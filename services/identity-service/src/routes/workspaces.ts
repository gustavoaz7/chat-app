import { CreateWorkspaceRequestSchema } from "../../../../packages/contracts/src";
import { WorkspaceService } from "../domain/workspace-service";

interface AppRouteRegistrar {
  post(
    path: string,
    handler: (
      request: { body?: unknown },
      reply: {
        code: (statusCode: number) => {
          send: (payload: unknown) => { statusCode: number; payload: unknown };
        };
      },
    ) => Promise<unknown> | unknown,
  ): void;
}

export async function registerWorkspaceRoutes(app: AppRouteRegistrar) {
  const workspaceService = new WorkspaceService();

  app.post("/workspaces", async (request, reply) => {
    const payload = CreateWorkspaceRequestSchema.parse(request.body);
    const workspace = await workspaceService.createWorkspace(payload);

    return reply.code(201).send(workspace);
  });
}
