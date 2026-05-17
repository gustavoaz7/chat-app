export interface ChatProvisioningClientPort {
  createDefaultChannel(input: {
    workspaceId: string;
    name: string;
  }): Promise<{
    id: string;
    name: string;
  }>;
}
