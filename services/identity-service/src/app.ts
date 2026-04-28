import Fastify from "fastify";
import { WorkspaceService } from "./domain/workspace-service";
import { registerHealthRoutes } from "./routes/health";
import { registerWorkspaceRoutes } from "./routes/workspaces";

export function buildApp(deps?: { workspaceService: WorkspaceService }) {
  const app = Fastify();
  const workspaceService =
    deps === undefined ? new WorkspaceService() : deps.workspaceService;

  void registerHealthRoutes(app);
  void registerWorkspaceRoutes(app, workspaceService);

  return app;
}
