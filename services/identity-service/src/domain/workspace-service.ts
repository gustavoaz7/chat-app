import { defaultChannelName } from "@team-chat/database";
import type { ChatProvisioningClientPort } from "./chat-provisioning-client";
import type {
  WorkspaceRecord,
  WorkspaceRepositoryPort,
} from "./workspace-repository";

export interface WorkspaceServicePort {
  createWorkspace(input: {
    name: string;
    ownerUserId: string;
  }): Promise<WorkspaceRecord>;
}

export class WorkspaceService implements WorkspaceServicePort {
  constructor(
    private readonly repository: WorkspaceRepositoryPort,
    private readonly chatProvisioningClient: ChatProvisioningClientPort,
  ) {}

  async createWorkspace(input: {
    name: string;
    ownerUserId: string;
  }): Promise<WorkspaceRecord> {
    const workspace = await this.repository.create({
      id: `ws_${crypto.randomUUID()}`,
      name: input.name,
      ownerUserId: input.ownerUserId,
    });

    try {
      const channel = await this.chatProvisioningClient.createDefaultChannel({
        workspaceId: workspace.id,
        name: defaultChannelName,
      });

      await this.repository.updateDefaultChannelId(workspace.id, channel.id);

      return {
        ...workspace,
        defaultChannelId: channel.id,
      };
    } catch (error) {
      await this.repository.deleteById(workspace.id);
      throw error;
    }
  }
}
