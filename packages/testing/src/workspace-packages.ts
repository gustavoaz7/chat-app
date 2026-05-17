export function workspacePackages(): string[] {
  return [
    "apps/web",
    "packages/config",
    "packages/contracts",
    "packages/database",
    "packages/observability",
    "packages/testing",
    "services/api-gateway",
    "services/chat-service",
    "services/identity-service",
    "services/notification-service",
    "services/realtime-gateway",
    "services/search-service",
  ];
}
