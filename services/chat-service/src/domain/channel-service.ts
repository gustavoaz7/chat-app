import type { ChannelRepositoryPort } from "./channel-repository";

export interface ChannelRecord {
  id: string;
  workspaceId: string;
  name: string;
  kind: "channel";
}

export interface ChannelServicePort {
  createDefaultChannel(input: {
    workspaceId: string;
    name: string;
  }): Promise<ChannelRecord>;
}

export class ChannelService implements ChannelServicePort {
  constructor(private readonly repository: ChannelRepositoryPort) {}

  createDefaultChannel(input: {
    workspaceId: string;
    name: string;
  }) {
    return this.repository.createDefaultChannel(input);
  }
}
