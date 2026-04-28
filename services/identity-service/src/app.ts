import Fastify from "fastify";
import { registerHealthRoutes } from "./routes/health";
import { registerWorkspaceRoutes } from "./routes/workspaces";

export function buildApp() {
  const app = Fastify();

  void registerHealthRoutes(app);
  void registerWorkspaceRoutes(app);

  return app;
}
