export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerUserId: string;
}

export interface WorkspaceServicePort {
  createWorkspace(input: {
    name: string;
    ownerUserId: string;
  }): Promise<WorkspaceRecord>;
}

export class WorkspaceService implements WorkspaceServicePort {
  async createWorkspace(input: {
    name: string;
    ownerUserId: string;
  }): Promise<WorkspaceRecord> {
    return {
      id: "ws_local_1",
      name: input.name,
      ownerUserId: input.ownerUserId,
    };
  }
}
