import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { workspacePackages } from "./workspace-packages";

function packageDirectories(parentDirectory: string): string[] {
  return readdirSync(parentDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${parentDirectory}/${entry.name}`);
}

function packageManifest(relativePath: string): { scripts?: Record<string, string> } {
  return JSON.parse(readFileSync(join(relativePath, "package.json"), "utf8")) as { scripts?: Record<string, string> };
}

describe("workspace packages", () => {
  it("declares the required top-level apps and services", () => {
    expect(workspacePackages()).toEqual(
      [...packageDirectories("apps"), ...packageDirectories("packages"), ...packageDirectories("services")].sort(),
    );
  });

  it("keeps each workspace package aligned with the root script contract", () => {
    const rootManifest = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(Object.keys(rootManifest.scripts)).toEqual([
      "build",
      "dev",
      "lint",
      "test",
      "typecheck",
    ]);

    for (const packagePath of workspacePackages()) {
      const manifest = packageManifest(packagePath);

      expect(manifest.scripts).toBeDefined();
      expect(Object.keys(manifest.scripts ?? {})).toEqual(Object.keys(rootManifest.scripts));
    }
  });
});
