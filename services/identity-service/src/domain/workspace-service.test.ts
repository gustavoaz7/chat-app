import { describe, expect, it, vi } from "vitest";
import { defaultChannelName } from "@team-chat/database";
import { WorkspaceService } from "./workspace-service";

describe("WorkspaceService", () => {
  it("creates a workspace with a generated id and stores the default channel id", async () => {
    const create = vi.fn(async (input: {
      id: string;
      name: string;
      ownerUserId: string;
    }) => ({
      ...input,
      defaultChannelId: null,
    }));
    const updateDefaultChannelId = vi.fn(async () => undefined);
    const deleteById = vi.fn(async () => undefined);
    const createDefaultChannel = vi.fn(async () => ({
      id: "ch_1",
      name: defaultChannelName,
    }));

    const randomUuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("123e4567-e89b-12d3-a456-426614174000");

    const service = new WorkspaceService(
      { create, updateDefaultChannelId, deleteById },
      { createDefaultChannel },
    );

    const workspace = await service.createWorkspace({
      name: "Launch Room",
      ownerUserId: "user_1",
    });

    expect(create).toHaveBeenCalledWith({
      id: "ws_123e4567-e89b-12d3-a456-426614174000",
      name: "Launch Room",
      ownerUserId: "user_1",
    });
    expect(createDefaultChannel).toHaveBeenCalledWith({
      workspaceId: "ws_123e4567-e89b-12d3-a456-426614174000",
      name: defaultChannelName,
    });
    expect(updateDefaultChannelId).toHaveBeenCalledWith(
      "ws_123e4567-e89b-12d3-a456-426614174000",
      "ch_1",
    );
    expect(deleteById).not.toHaveBeenCalled();
    expect(workspace).toEqual({
      id: "ws_123e4567-e89b-12d3-a456-426614174000",
      name: "Launch Room",
      ownerUserId: "user_1",
      defaultChannelId: "ch_1",
    });

    randomUuidSpy.mockRestore();
  });

  it("deletes the workspace when chat provisioning fails", async () => {
    const deleteById = vi.fn(async () => undefined);
    const createDefaultChannel = vi.fn(async () => {
      throw new Error("chat unavailable");
    });

    const randomUuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("123e4567-e89b-12d3-a456-426614174000");

    const service = new WorkspaceService(
      {
        create: vi.fn(async (input: {
          id: string;
          name: string;
          ownerUserId: string;
        }) => ({
          ...input,
          defaultChannelId: null,
        })),
        updateDefaultChannelId: vi.fn(async () => undefined),
        deleteById,
      },
      { createDefaultChannel },
    );

    await expect(
      service.createWorkspace({
        name: "Launch Room",
        ownerUserId: "user_1",
      }),
    ).rejects.toThrow("chat unavailable");

    expect(deleteById).toHaveBeenCalledWith(
      "ws_123e4567-e89b-12d3-a456-426614174000",
    );

    randomUuidSpy.mockRestore();
  });

  it("deletes the workspace when persisting the default channel id fails", async () => {
    const deleteById = vi.fn(async () => undefined);
    const createDefaultChannel = vi.fn(async () => ({
      id: "ch_1",
      name: defaultChannelName,
    }));
    const updateDefaultChannelId = vi.fn(async () => {
      throw new Error("workspace update failed");
    });

    const randomUuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("123e4567-e89b-12d3-a456-426614174000");

    const service = new WorkspaceService(
      {
        create: vi.fn(async (input: {
          id: string;
          name: string;
          ownerUserId: string;
        }) => ({
          ...input,
          defaultChannelId: null,
        })),
        updateDefaultChannelId,
        deleteById,
      },
      { createDefaultChannel },
    );

    await expect(
      service.createWorkspace({
        name: "Launch Room",
        ownerUserId: "user_1",
      }),
    ).rejects.toThrow("workspace update failed");

    expect(updateDefaultChannelId).toHaveBeenCalledWith(
      "ws_123e4567-e89b-12d3-a456-426614174000",
      "ch_1",
    );
    expect(deleteById).toHaveBeenCalledWith(
      "ws_123e4567-e89b-12d3-a456-426614174000",
    );

    randomUuidSpy.mockRestore();
  });
});
