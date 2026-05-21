import Fastify from "fastify";
import type { ChatProvisioningClientPort } from "./domain/chat-provisioning-client";
import type { WorkspaceRepositoryPort } from "./domain/workspace-repository";
import { WorkspaceService } from "./domain/workspace-service";
import type { WorkspaceServicePort } from "./domain/workspace-service";
import { registerHealthRoutes } from "./routes/health";
import { registerWorkspaceRoutes } from "./routes/workspaces";

export function buildApp(deps?: { workspaceService: WorkspaceServicePort }) {
  const app = Fastify();
  const workspaceService = deps?.workspaceService;
  const workspaces = new Map<
    string,
    {
      id: string;
      name: string;
      ownerUserId: string;
      defaultChannelId: string | null;
    }
  >();
  const workspaceRepository: WorkspaceRepositoryPort = {
    async create(input) {
      const workspace = {
        ...input,
        defaultChannelId: null,
      };

      workspaces.set(workspace.id, workspace);

      return workspace;
    },
    async updateDefaultChannelId(workspaceId, channelId) {
      const workspace = workspaces.get(workspaceId);

      if (workspace === undefined) {
        throw new Error(`workspace ${workspaceId} not found`);
      }

      workspace.defaultChannelId = channelId;
    },
    async deleteById(workspaceId) {
      workspaces.delete(workspaceId);
    },
  };
  const chatProvisioningClient: ChatProvisioningClientPort = {
    async createDefaultChannel(input) {
      return {
        id: `ch_${crypto.randomUUID()}`,
        name: input.name,
      };
    },
  };

  if (deps !== undefined && typeof workspaceService?.createWorkspace !== "function") {
    throw new Error("workspaceService dependency is required when deps are provided");
  }

  void registerHealthRoutes(app);
  void registerWorkspaceRoutes(
    app,
    workspaceService ?? new WorkspaceService(workspaceRepository, chatProvisioningClient),
  );

  return app;
}
