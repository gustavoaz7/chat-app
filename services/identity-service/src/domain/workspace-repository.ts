export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerUserId: string;
  defaultChannelId: string | null;
}

export interface WorkspaceRepositoryPort {
  create(input: {
    id: string;
    name: string;
    ownerUserId: string;
  }): Promise<WorkspaceRecord>;
  updateDefaultChannelId(workspaceId: string, channelId: string): Promise<void>;
  deleteById(workspaceId: string): Promise<void>;
}
