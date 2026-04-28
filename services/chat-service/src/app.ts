import Fastify from "fastify";
import { registerMessageRoutes } from "./routes/messages";

export function buildApp() {
  const app = Fastify();

  void registerMessageRoutes(app);

  return app;
}
