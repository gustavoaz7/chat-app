import { describe, expect, it } from "vitest";
import { workspacePackages } from "./workspace-packages";

describe("workspace packages", () => {
  it("declares the required top-level apps and services", () => {
    expect(workspacePackages()).toEqual([
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
    ]);
  });
});
