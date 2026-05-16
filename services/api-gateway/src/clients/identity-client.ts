export interface CreateWorkspacePayload {
  name: string;
  ownerUserId: string;
}

export interface IdentityClientPort {
  createWorkspace(payload: CreateWorkspacePayload): Promise<unknown>;
}
