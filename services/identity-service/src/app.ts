import Fastify from "fastify";
import { WorkspaceService } from "./domain/workspace-service";
import { registerHealthRoutes } from "./routes/health";
import { registerWorkspaceRoutes } from "./routes/workspaces";

export function buildApp() {
  const app = Fastify();
  const workspaceService = new WorkspaceService();

  void registerHealthRoutes(app);
  void registerWorkspaceRoutes(app, workspaceService);

  return app;
}
