import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { workspacePackages } from "./workspace-packages";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function packageDirectories(parentDirectory: string): string[] {
  return readdirSync(join(workspaceRoot, parentDirectory), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${parentDirectory}/${entry.name}`);
}

function packageManifest(relativePath: string): { scripts?: Record<string, string> } {
  return JSON.parse(readFileSync(join(workspaceRoot, relativePath, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
}

const expectedScriptsByPackage: Record<string, string[]> = {
  "apps/web": ["build", "dev", "e2e", "lint", "test", "typecheck"],
};

describe("workspace packages", () => {
  it("declares the required top-level apps and services", () => {
    expect(workspacePackages()).toEqual(
      [...packageDirectories("apps"), ...packageDirectories("packages"), ...packageDirectories("services")].sort(),
    );
  });

  it("keeps each workspace package aligned with the required root script contract", () => {
    const rootManifest = JSON.parse(readFileSync(join(workspaceRoot, "package.json"), "utf8")) as {
      devDependencies?: Record<string, string>;
      scripts: Record<string, string>;
    };

    expect(Object.keys(rootManifest.scripts)).toEqual([
      "build",
      "dev",
      "lint",
      "test",
      "typecheck",
    ]);

    expect(rootManifest.devDependencies).toMatchObject({
      typescript: expect.any(String),
      vitest: expect.any(String),
    });

    for (const packagePath of workspacePackages()) {
      const manifest = packageManifest(packagePath);
      const packageScriptNames = Object.keys(manifest.scripts ?? {});
      const expectedScriptNames = expectedScriptsByPackage[packagePath] ?? Object.keys(rootManifest.scripts);

      expect(manifest.scripts).toBeDefined();
      expect(packageScriptNames).toEqual(expectedScriptNames);
    }

    expect(packageManifest("packages/testing").scripts?.test).toBe("vitest run src/workspace.test.ts");
    expect(packageManifest("apps/web").scripts?.e2e).toBe("playwright test e2e/chat.spec.ts");
  });
});
