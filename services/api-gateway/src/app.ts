import Fastify from "fastify";
import type { ChatClientPort } from "./clients/chat-client";
import type { IdentityClientPort } from "./clients/identity-client";
import { registerMessageRoutes } from "./routes/messages";
import { registerWorkspaceRoutes } from "./routes/workspaces";

export interface ApiGatewayDependencies {
  identityClient: IdentityClientPort;
  chatClient: ChatClientPort;
}

export function buildApp(deps: ApiGatewayDependencies) {
  if (deps === undefined) {
    throw new Error("api gateway dependencies are required");
  }

  if (typeof deps.identityClient?.createWorkspace !== "function") {
    throw new Error("identityClient.createWorkspace is required");
  }

  if (typeof deps.chatClient?.sendMessage !== "function") {
    throw new Error("chatClient.sendMessage is required");
  }

  const app = Fastify();

  registerWorkspaceRoutes(app, deps.identityClient);
  registerMessageRoutes(app, deps.chatClient);

  return app;
}
