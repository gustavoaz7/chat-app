import Fastify from "fastify";
import { WorkspaceService } from "./domain/workspace-service";
import { registerHealthRoutes } from "./routes/health";
import { registerWorkspaceRoutes } from "./routes/workspaces";

export function buildApp(deps?: { workspaceService: WorkspaceService }) {
  const app = Fastify();
  const workspaceService = deps?.workspaceService;

  if (deps !== undefined && !(workspaceService instanceof WorkspaceService)) {
    throw new Error("workspaceService dependency is required when deps are provided");
  }

  void registerHealthRoutes(app);
  void registerWorkspaceRoutes(app, workspaceService ?? new WorkspaceService());

  return app;
}
