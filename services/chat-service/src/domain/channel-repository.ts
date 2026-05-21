import type { ChannelRecord } from "./channel-service";

export interface ChannelRepositoryPort {
  createDefaultChannel(input: {
    workspaceId: string;
    name: string;
  }): Promise<ChannelRecord>;
}

export class InMemoryChannelRepository implements ChannelRepositoryPort {
  async createDefaultChannel(input: {
    workspaceId: string;
    name: string;
  }): Promise<ChannelRecord> {
    return {
      id: `ch_${crypto.randomUUID()}`,
      workspaceId: input.workspaceId,
      name: input.name,
      kind: "channel",
    };
  }
}
