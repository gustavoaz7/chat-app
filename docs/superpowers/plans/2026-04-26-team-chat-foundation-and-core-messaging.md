# Team Chat Foundation And Core Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the initial multi-service foundation for the team chat platform and ship one working end-to-end slice: create a workspace, connect over websockets, send a message into a seeded channel, persist it, and fan it out in realtime.

**Architecture:** Start with a TypeScript monorepo containing a React web app, an API gateway, domain services for identity and chat, a realtime gateway, and skeleton async consumers for notifications and search. Use Postgres for durable state, Redis for ephemeral state, and an event broker-backed outbox flow so the first slice already follows the final architecture.

**Tech Stack:** `pnpm`, TypeScript, React + Vite, Node.js, Fastify, PostgreSQL, Redis, NATS, Docker Compose, Prisma, Zod, Vitest, Playwright, OpenTelemetry

---

## Scope Check

The full spec covers more than one implementation wave. This plan intentionally covers:

- monorepo and local infrastructure
- service contracts and shared packages
- identity/workspace service
- chat core service
- realtime gateway
- API gateway
- one working message flow
- skeleton async consumers for notifications and search
- baseline observability, tests, and CI

This plan intentionally defers:

- file attachments
- production-grade notifications
- full-text search implementation details
- advanced RBAC matrices
- background reindex tooling
- Kubernetes deployment
- end-to-end encryption

## Planned File Structure

### Applications and services

- Create: `apps/web/`
- Create: `services/api-gateway/`
- Create: `services/identity-service/`
- Create: `services/chat-service/`
- Create: `services/realtime-gateway/`
- Create: `services/notification-service/`
- Create: `services/search-service/`

### Shared packages

- Create: `packages/contracts/`
- Create: `packages/config/`
- Create: `packages/database/`
- Create: `packages/observability/`
- Create: `packages/testing/`

### Infrastructure and docs

- Create: `infra/docker-compose.yml`
- Create: `infra/nats/`
- Create: `infra/otel/`
- Create: `.github/workflows/ci.yml`
- Create: `docs/architecture/runtime-topology.md`
- Create: `docs/runbooks/local-development.md`

### Responsibility map

- `apps/web`: thin frontend shell for auth, workspace/channel navigation, and chat UI
- `services/api-gateway`: frontend-facing HTTP API, request auth, response composition
- `services/identity-service`: users, workspaces, memberships, invitations, roles
- `services/chat-service`: channels, messages, threads, reactions, read state, outbox
- `services/realtime-gateway`: websocket sessions, presence, subscriptions, fan-out
- `services/notification-service`: initial event consumer stub and health endpoint
- `services/search-service`: initial event consumer stub and health endpoint
- `packages/contracts`: DTOs, event schemas, route schemas
- `packages/config`: shared environment parsing and service config
- `packages/database`: Prisma clients, migrations, DB helpers
- `packages/observability`: logger, tracing, metrics bootstrap
- `packages/testing`: factories, testcontainers helpers, common test bootstraps

### Architecture decisions to preserve during implementation

- one database schema per service even if all schemas live in the same Postgres instance
- `Chat Service` owns canonical message state
- `Realtime Gateway` only delivers and tracks ephemeral connection state
- all side effects after message persistence flow through outbox events
- shared types live in `packages/contracts`, not in ad hoc cross-service imports

## Task 1: Bootstrap The Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.nvmrc`
- Create: `apps/web/package.json`
- Create: `services/api-gateway/package.json`
- Create: `services/identity-service/package.json`
- Create: `services/chat-service/package.json`
- Create: `services/realtime-gateway/package.json`
- Create: `services/notification-service/package.json`
- Create: `services/search-service/package.json`
- Create: `packages/contracts/package.json`
- Create: `packages/config/package.json`
- Create: `packages/database/package.json`
- Create: `packages/observability/package.json`
- Create: `packages/testing/package.json`

- [ ] **Step 1: Write the failing workspace sanity test**

```ts
// packages/testing/src/workspace.test.ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { workspacePackages } from "./workspace-packages";

function discoverWorkspacePackages(): string[] {
  return ["apps", "packages", "services"].flatMap((topLevelDir) =>
    readdirSync(topLevelDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${topLevelDir}/${entry.name}`),
  );
}

describe("workspace packages", () => {
  it("declares the required top-level apps and services on disk", () => {
    expect(workspacePackages()).toEqual(discoverWorkspacePackages().sort());
  });

  it("keeps every workspace manifest aligned with the root script contract", () => {
    const rootPackageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    for (const workspacePackage of workspacePackages()) {
      const workspacePackageJson = JSON.parse(
        readFileSync(join(workspacePackage, "package.json"), "utf8"),
      ) as { scripts: Record<string, string> };

      expect(Object.keys(workspacePackageJson.scripts).sort()).toEqual(
        Object.keys(rootPackageJson.scripts).sort(),
      );
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest packages/testing/src/workspace.test.ts`
Expected: FAIL with missing workspace files or missing `workspacePackages` export.

- [ ] **Step 3: Write minimal monorepo configuration**

```json
// package.json
{
  "name": "team-chat-platform",
  "private": true,
  "packageManager": "pnpm@10.8.0",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vitest": "^3.1.0"
  }
}
```

Each workspace manifest should also expose minimal `build`, `dev`, `lint`, `test`, and `typecheck` scripts so the root recursive scripts are valid from day one. `packages/testing/package.json` should wire `test` to `vitest run src/workspace.test.ts`, while the other workspace manifests may use lightweight placeholder scripts until their real tasks begin.

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
```

```ts
// packages/testing/src/workspace-packages.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest packages/testing/src/workspace.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .editorconfig .nvmrc apps services packages
git commit -m "chore: bootstrap monorepo structure"
```

## Task 2: Stand Up Local Infrastructure

**Files:**
- Create: `infra/docker-compose.yml`
- Create: `infra/.env.example`
- Create: `docs/runbooks/local-development.md`

- [ ] **Step 1: Write the failing infrastructure smoke test**

```ts
// packages/testing/src/infra-smoke.test.ts
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(join(workspaceRoot, relativePath), "utf8");
}

function parseEnvFile(content: string): Record<string, string> {
  return Object.fromEntries(
    content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .map((line) => {
        const [key, ...value] = line.split("=");
        return [key, value.join("=")];
      }),
  );
}

describe("local infrastructure", () => {
  it("defines postgres, redis, and nats in docker compose", () => {
    const compose = readWorkspaceFile("infra/docker-compose.yml");
    const envExample = parseEnvFile(readWorkspaceFile("infra/.env.example"));

    expect(compose.match(/^  postgres:$/m)).not.toBeNull();
    expect(compose.match(/^  redis:$/m)).not.toBeNull();
    expect(compose.match(/^  nats:$/m)).not.toBeNull();
    expect(compose.match(/POSTGRES_DB:\s+team_chat/)).not.toBeNull();
    expect(compose.match(/-\s+"5432:5432"/)).not.toBeNull();
    expect(compose.match(/-\s+"6379:6379"/)).not.toBeNull();
    expect(compose.match(/-\s+"4222:4222"/)).not.toBeNull();
    expect(compose.match(/-\s+"8222:8222"/)).not.toBeNull();
    expect(compose.match(/command:\s+\["-js"\]/)).not.toBeNull();

    expect(envExample).toEqual({
      POSTGRES_URL: "postgresql://chat:chat@localhost:5432/team_chat",
      REDIS_URL: "redis://localhost:6379",
      NATS_URL: "nats://localhost:4222",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest packages/testing/src/infra-smoke.test.ts`
Expected: FAIL because `infra/docker-compose.yml` does not exist.

- [ ] **Step 3: Write minimal infrastructure definitions**

```yaml
# infra/docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: chat
      POSTGRES_PASSWORD: chat
      POSTGRES_DB: team_chat
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  nats:
    image: nats:2.10
    command: ["-js"]
    ports:
      - "4222:4222"
      - "8222:8222"
```

```env
# infra/.env.example
POSTGRES_URL=postgresql://chat:chat@localhost:5432/team_chat
REDIS_URL=redis://localhost:6379
NATS_URL=nats://localhost:4222
```

```md
# docs/runbooks/local-development.md

## Start local infrastructure

Run:

`docker compose -f infra/docker-compose.yml up -d`
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest packages/testing/src/infra-smoke.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add infra/docker-compose.yml infra/.env.example docs/runbooks/local-development.md packages/testing/src/infra-smoke.test.ts
git commit -m "chore: add local infrastructure stack"
```

## Task 3: Create Shared Contracts And Config

**Files:**
- Create: `packages/contracts/src/http.ts`
- Create: `packages/contracts/src/events.ts`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/config/src/env.ts`
- Create: `packages/config/src/index.ts`
- Modify: `packages/contracts/package.json`
- Modify: `packages/config/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/config/tsconfig.json`
- Create: `packages/contracts/tsconfig.test.json`
- Create: `packages/config/tsconfig.test.json`
- Test: `packages/contracts/src/contracts.test.ts`
- Test: `packages/config/src/env.test.ts`

- [ ] **Step 1: Write the failing contract test**

```ts
// packages/contracts/src/contracts.test.ts
import { describe, expect, it } from "vitest";
import { MessageSentEventSchema, SendMessageRequestSchema } from "./index";

describe("shared contracts", () => {
  it("exposes a send-message request schema", () => {
    const parsed = SendMessageRequestSchema.parse({
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "hello",
    });

    expect(parsed.body).toBe("hello");
  });

  it("exposes a message-sent event schema", () => {
    const parsed = MessageSentEventSchema.parse({
      type: "chat.message.sent",
      messageId: "msg_123",
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "hello",
    });

    expect(parsed.type).toBe("chat.message.sent");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest packages/contracts/src/contracts.test.ts`
Expected: FAIL because schemas do not exist.

- [ ] **Step 3: Write minimal contracts and config**

```ts
// packages/contracts/src/http.ts
import { z } from "zod";

export const MessageBodySchema = z.string().min(1).max(4000);

export const SendMessageRequestSchema = z.object({
  workspaceId: z.string().min(1),
  channelId: z.string().min(1),
  senderId: z.string().min(1),
  body: MessageBodySchema,
});

export const CreateWorkspaceRequestSchema = z.object({
  name: z.string().min(1).max(120),
  ownerUserId: z.string().min(1),
});
```

```ts
// packages/contracts/src/events.ts
import { z } from "zod";
import { MessageBodySchema } from "./http";

export const MessageSentEventSchema = z.object({
  type: z.literal("chat.message.sent"),
  messageId: z.string().min(1),
  workspaceId: z.string().min(1),
  channelId: z.string().min(1),
  senderId: z.string().min(1),
  body: MessageBodySchema,
});
```

```ts
// packages/config/src/env.ts
import { z } from "zod";

export const BaseServiceEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive(),
});

export const PostgresEnvSchema = z.object({
  POSTGRES_URL: z.string().url(),
});

export const RedisEnvSchema = z.object({
  REDIS_URL: z.string().url(),
});

export const NatsEnvSchema = z.object({
  NATS_URL: z.string().url(),
});
```

`packages/contracts/package.json` and `packages/config/package.json` should declare `zod` so the schemas are executable and the contract test can pass honestly.

Also tighten the contract test so it covers:
- `CreateWorkspaceRequestSchema`
- the shared message-body limit being enforced consistently by both `SendMessageRequestSchema` and `MessageSentEventSchema`
- `packages/config/src/env.test.ts` should cover:
  - `BaseServiceEnvSchema` defaulting `NODE_ENV` to `development`
  - `PORT` coercion from string to number
  - `PostgresEnvSchema`, `RedisEnvSchema`, and `NatsEnvSchema` accepting valid URLs
- `packages/config/src/env.test.ts` should import from the public package entrypoint rather than `./env`
- `packages/contracts/src/contracts.test.ts` should import from the public package entrypoint rather than `./index`
- `packages/contracts/package.json` and `packages/config/package.json` should stop using fake success scripts for package quality gates
- add package-local `tsconfig.json` files and make:
  - `build` emit declarations into `dist/`
  - `typecheck` run `tsc --noEmit`
  - `lint` run the same TypeScript static check until a dedicated linter is introduced
  - `test` run the real Vitest file for each package
- `packages/contracts/package.json` should expose the public package entrypoint used by the test, matching the `config` package pattern
- separate production package compiler config from test compiler config:
  - `tsconfig.json` should cover package source only
  - `tsconfig.test.json` should cover test files and include `vitest/globals`
  - package test scripts may use the test tsconfig, but package build/typecheck/lint should not depend on test files or test-only globals

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest packages/contracts/src/contracts.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/contracts packages/config
git commit -m "feat: add shared contracts and config schemas"
```

## Task 4: Build The Identity And Workspace Service

**Files:**
- Create: `services/identity-service/src/app.ts`
- Create: `services/identity-service/src/routes/health.ts`
- Create: `services/identity-service/src/routes/workspaces.ts`
- Create: `services/identity-service/src/domain/workspace-service.ts`
- Create: `services/identity-service/prisma/schema.prisma`
- Modify: `services/identity-service/package.json`
- Test: `services/identity-service/src/routes/workspaces.test.ts`

- [ ] **Step 1: Write the failing workspace creation test**

```ts
// services/identity-service/src/routes/workspaces.test.ts
import { describe, expect, it } from "vitest";
import { buildApp } from "../app";

describe("POST /workspaces", () => {
  it("creates a workspace for an owner", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/workspaces",
      payload: {
        name: "Acme",
        ownerUserId: "usr_123",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      name: "Acme",
      ownerUserId: "usr_123",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @services/identity-service vitest src/routes/workspaces.test.ts`
Expected: FAIL because `buildApp` and route handlers do not exist.

- [ ] **Step 3: Write minimal identity service implementation**

```ts
// services/identity-service/src/domain/workspace-service.ts
export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerUserId: string;
}

export class WorkspaceService {
  async createWorkspace(input: { name: string; ownerUserId: string }): Promise<WorkspaceRecord> {
    return {
      id: "ws_local_1",
      name: input.name,
      ownerUserId: input.ownerUserId,
    };
  }
}
```

```ts
// services/identity-service/src/routes/workspaces.ts
import type { FastifyInstance } from "fastify";
import { CreateWorkspaceRequestSchema } from "@team-chat/contracts";
import { WorkspaceService } from "../domain/workspace-service";

export async function registerWorkspaceRoutes(
  app: FastifyInstance,
  workspaceService: Pick<WorkspaceService, "createWorkspace">,
) {
  app.post("/workspaces", async (request, reply) => {
    const parsed = CreateWorkspaceRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid workspace payload",
        issues: parsed.error.issues,
      });
    }

    const payload = parsed.data;
    const workspace = await workspaceService.createWorkspace(payload);
    return reply.code(201).send(workspace);
  });
}
```

```ts
// services/identity-service/src/app.ts
import Fastify from "fastify";
import { WorkspaceService, type WorkspaceServicePort } from "./domain/workspace-service";
import { registerWorkspaceRoutes } from "./routes/workspaces";

export function buildApp(deps?: {
  workspaceService: WorkspaceServicePort;
}) {
  const app = Fastify();
  const workspaceService = deps ? deps.workspaceService : new WorkspaceService();
  void registerWorkspaceRoutes(app, workspaceService);
  return app;
}
```

`services/identity-service/package.json` should declare the minimum dependencies needed to support the requested Task 4 shape, including `fastify` and the workspace dependency on `@team-chat/contracts`, so the service can use the real package import and app bootstrap rather than a local test harness.

Also tighten the service package interface so `services/identity-service/package.json` runs a real local `test` script for `src/routes/workspaces.test.ts`, and use the same local command for `lint`/`typecheck` quality gates until dedicated service-level tooling is introduced.

Tighten the service package interface further so it does not advertise fake capabilities:
- keep a real local `test` script for the workspace-route test
- remove or stop exposing misleading `build`, `dev`, `lint`, and `typecheck` scripts until real service tooling exists
- tests that exercise injection should use the `WorkspaceServicePort` shape directly rather than subclassing the concrete `WorkspaceService`
- `buildApp()` should accept the same `WorkspaceServicePort` abstraction that `registerWorkspaceRoutes()` uses, so the app boundary and route boundary stay aligned
- add a focused invalid-payload test proving malformed create-workspace input returns an explicit 4xx response instead of surfacing as a generic server error

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @services/identity-service vitest src/routes/workspaces.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/identity-service
git commit -m "feat: add identity workspace creation service"
```

## Task 5: Build The Chat Service With Outbox-Backed Message Persistence

**Files:**
- Create: `services/chat-service/src/app.ts`
- Create: `services/chat-service/src/routes/messages.ts`
- Create: `services/chat-service/src/domain/message-service.ts`
- Create: `services/chat-service/src/domain/outbox-repository.ts`
- Create: `services/chat-service/prisma/schema.prisma`
- Modify: `services/chat-service/package.json`
- Test: `services/chat-service/src/routes/messages.test.ts`

- [ ] **Step 1: Write the failing send-message test**

```ts
// services/chat-service/src/routes/messages.test.ts
import { describe, expect, it } from "vitest";
import { buildApp } from "../app";

describe("POST /messages", () => {
  it("persists a message and records an outbox event", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/messages",
      payload: {
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body: "hello world",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      workspaceId: "ws_123",
      channelId: "ch_123",
      senderId: "usr_123",
      body: "hello world",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @services/chat-service vitest src/routes/messages.test.ts`
Expected: FAIL because the app and message route do not exist.

- [ ] **Step 3: Write minimal chat service and outbox flow**

```ts
// services/chat-service/src/domain/outbox-repository.ts
export interface OutboxEventRecord {
  type: "chat.message.sent";
  payload: {
    messageId: string;
    workspaceId: string;
    channelId: string;
    senderId: string;
    body: string;
  };
}

export class OutboxRepository {
  private readonly events: OutboxEventRecord[] = [];

  async append(event: OutboxEventRecord): Promise<void> {
    this.events.push(event);
  }

  all(): OutboxEventRecord[] {
    return this.events.map((event) => ({
      ...event,
      payload: { ...event.payload },
    }));
  }
}
```

```ts
// services/chat-service/src/domain/message-service.ts
import type { OutboxWriterPort } from "./outbox-repository";

export interface MessageRecord {
  id: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  body: string;
}

export class MessageService {
  constructor(private readonly outbox: OutboxWriterPort) {}

  private nextId = 1;

  async sendMessage(input: Omit<MessageRecord, "id">): Promise<MessageRecord> {
    const message: MessageRecord = {
      id: `msg_local_${this.nextId++}`,
      ...input,
    };

    await this.outbox.append({
      type: "chat.message.sent",
      payload: {
        messageId: message.id,
        workspaceId: message.workspaceId,
        channelId: message.channelId,
        senderId: message.senderId,
        body: message.body,
      },
    });

    return message;
  }
}
```

```ts
// services/chat-service/src/routes/messages.ts
import type { FastifyInstance } from "fastify";
import { SendMessageRequestSchema } from "@team-chat/contracts";
import type { MessageServicePort } from "../domain/message-service";

export function registerMessageRoutes(
  app: FastifyInstance,
  messageService: MessageServicePort,
) {
  app.post("/messages", async (request, reply) => {
    const payload = SendMessageRequestSchema.parse(request.body);
    const message = await messageService.sendMessage(payload);
    return reply.code(201).send(message);
  });
}
```

`services/chat-service/src/app.ts` should construct the concrete `OutboxRepository` and `MessageService`, then inject `messageService` into `registerMessageRoutes(...)` so the HTTP layer does not construct its own chat dependencies.

Tighten `services/chat-service/src/routes/messages.test.ts` so it verifies the outbox behavior it claims to cover. The test should exercise a route wired with an observable outbox-backed `MessageService` and assert both:
- the HTTP response payload
- the recorded outbox event contents
- the returned outbox snapshots are defensively copied deeply enough that mutating a prior read cannot corrupt stored event payloads

`services/chat-service/package.json` should declare the minimum dependencies needed to support the requested Task 5 shape, including `fastify`, the workspace dependency on `@team-chat/contracts`, and the Prisma package wiring implied by the checked-in schema placeholder.
It should also stop advertising fake `build`, `dev`, `lint`, and `typecheck` success scripts; keep only commands that honestly work at this stage.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @services/chat-service vitest src/routes/messages.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/chat-service
git commit -m "feat: add chat message persistence and outbox flow"
```

## Task 6: Add The API Gateway And Service Composition

**Files:**
- Create: `services/api-gateway/src/app.ts`
- Create: `services/api-gateway/src/routes/workspaces.ts`
- Create: `services/api-gateway/src/routes/messages.ts`
- Create: `services/api-gateway/src/clients/identity-client.ts`
- Create: `services/api-gateway/src/clients/chat-client.ts`
- Test: `services/api-gateway/src/routes/gateway.test.ts`

- [ ] **Step 1: Write the failing gateway test**

```ts
// services/api-gateway/src/routes/gateway.test.ts
import { describe, expect, it } from "vitest";
import { buildApp } from "../app";

describe("API Gateway", () => {
  it("proxies workspace creation to identity service", async () => {
    const app = buildApp({
      identityClient: {
        createWorkspace: async (payload) => ({ id: "ws_123", ...payload }),
      },
      chatClient: {
        sendMessage: async (payload) => ({ id: "msg_123", ...payload }),
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: { name: "Acme", ownerUserId: "usr_123" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().id).toBe("ws_123");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @services/api-gateway vitest src/routes/gateway.test.ts`
Expected: FAIL because the gateway app and route registration do not exist.

- [ ] **Step 3: Write minimal gateway implementation**

```ts
// services/api-gateway/src/app.ts
import Fastify from "fastify";
import { registerMessageRoutes } from "./routes/messages";
import { registerWorkspaceRoutes } from "./routes/workspaces";

export function buildApp(deps: {
  identityClient: { createWorkspace: (payload: { name: string; ownerUserId: string }) => Promise<unknown> };
  chatClient: { sendMessage: (payload: { workspaceId: string; channelId: string; senderId: string; body: string }) => Promise<unknown> };
}) {
  const app = Fastify();

  registerWorkspaceRoutes(app, deps.identityClient);
  registerMessageRoutes(app, deps.chatClient);

  return app;
}
```

Keep the HTTP validation behavior explicit at the gateway boundary. `services/api-gateway/src/routes/workspaces.ts` and `services/api-gateway/src/routes/messages.ts` should validate payloads with the shared request schemas and return `400` without proxying invalid requests downstream.

`services/api-gateway/src/clients/identity-client.ts` and `services/api-gateway/src/clients/chat-client.ts` should define the narrow client ports consumed by the gateway app so later networked clients can slot in without rewriting route modules.

`services/api-gateway/package.json` should stop advertising fake-success scripts and keep only honest commands for the current stage, mirroring the pattern used in `services/chat-service`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @services/api-gateway vitest src/routes/gateway.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/api-gateway
git commit -m "feat: add api gateway service composition"
```

## Task 7: Add The Realtime Gateway

**Files:**
- Create: `services/realtime-gateway/src/app.ts`
- Create: `services/realtime-gateway/src/ws/session-manager.ts`
- Create: `services/realtime-gateway/src/ws/message-broadcast.ts`
- Test: `services/realtime-gateway/src/ws/message-broadcast.test.ts`

- [ ] **Step 1: Write the failing broadcast test**

```ts
// services/realtime-gateway/src/ws/message-broadcast.test.ts
import { describe, expect, it } from "vitest";
import { MessageBroadcast } from "./message-broadcast";

describe("MessageBroadcast", () => {
  it("delivers a message event to all subscribers of a channel", () => {
    const received: string[] = [];
    const broadcaster = new MessageBroadcast();

    broadcaster.subscribe("ch_123", (body) => {
      received.push(body.body);
    });

    broadcaster.publish("ch_123", {
      type: "chat.message.sent",
      body: "hello realtime",
    });

    expect(received).toEqual(["hello realtime"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @services/realtime-gateway vitest src/ws/message-broadcast.test.ts`
Expected: FAIL because `MessageBroadcast` does not exist.

- [ ] **Step 3: Write minimal realtime subscription and broadcast logic**

```ts
// services/realtime-gateway/src/ws/message-broadcast.ts
type Listener = (event: {
  type: "chat.message.sent";
  messageId: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  body: string;
}) => void;

export class MessageBroadcast {
  private readonly listeners = new Map<string, Listener[]>();

  subscribe(channelId: string, listener: Listener): () => void {
    const current = this.listeners.get(channelId) ?? [];
    this.listeners.set(channelId, [...current, listener]);

    return () => {
      const next = (this.listeners.get(channelId) ?? []).filter((entry) => entry !== listener);

      if (next.length === 0) {
        this.listeners.delete(channelId);
        return;
      }

      this.listeners.set(channelId, next);
    };
  }

  publish(channelId: string, event: {
    type: "chat.message.sent";
    messageId: string;
    workspaceId: string;
    channelId: string;
    senderId: string;
    body: string;
  }): void {
    for (const listener of [...(this.listeners.get(channelId) ?? [])]) {
      listener(event);
    }
  }
}
```

Add `services/realtime-gateway/src/ws/session-manager.ts` as a small in-memory seam that tracks connected session IDs per channel. The app does not need real websockets yet, but it should compose a `SessionManager` and `MessageBroadcast` together in `services/realtime-gateway/src/app.ts` so later websocket work has a stable place to attach.

`services/realtime-gateway/package.json` should also use honest stage-appropriate scripts rather than placeholder success commands.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @services/realtime-gateway vitest src/ws/message-broadcast.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/realtime-gateway
git commit -m "feat: add realtime broadcast gateway"
```

## Task 8: Add Notification And Search Consumer Skeletons

**Files:**
- Create: `services/notification-service/src/app.ts`
- Create: `services/notification-service/src/consumers/message-sent-consumer.ts`
- Create: `services/search-service/src/app.ts`
- Create: `services/search-service/src/consumers/message-sent-consumer.ts`
- Test: `services/notification-service/src/consumers/message-sent-consumer.test.ts`
- Test: `services/search-service/src/consumers/message-sent-consumer.test.ts`

- [ ] **Step 1: Write the failing consumer tests**

```ts
// services/notification-service/src/consumers/message-sent-consumer.test.ts
import { describe, expect, it } from "vitest";
import { createNotificationFromMessageSent } from "./message-sent-consumer";

describe("notification consumer", () => {
  it("turns a message-sent event into a notification candidate", () => {
    expect(
      createNotificationFromMessageSent({
        type: "chat.message.sent",
        messageId: "msg_123",
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body: "hello",
      }),
    ).toMatchObject({
      workspaceId: "ws_123",
      channelId: "ch_123",
    });
  });
});
```

```ts
// services/search-service/src/consumers/message-sent-consumer.test.ts
import { describe, expect, it } from "vitest";
import { createSearchDocumentFromMessageSent } from "./message-sent-consumer";

describe("search consumer", () => {
  it("projects a message event into a search document", () => {
    expect(
      createSearchDocumentFromMessageSent({
        type: "chat.message.sent",
        messageId: "msg_123",
        workspaceId: "ws_123",
        channelId: "ch_123",
        senderId: "usr_123",
        body: "hello",
      }),
    ).toMatchObject({
      id: "msg_123",
      workspaceId: "ws_123",
      body: "hello",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @services/notification-service vitest src/consumers/message-sent-consumer.test.ts`
Expected: FAIL because the consumer helper does not exist.

Run: `pnpm --filter @services/search-service vitest src/consumers/message-sent-consumer.test.ts`
Expected: FAIL because the projection helper does not exist.

- [ ] **Step 3: Write minimal consumer skeletons**

```ts
// services/notification-service/src/consumers/message-sent-consumer.ts
export function createNotificationFromMessageSent(event: {
  type: "chat.message.sent";
  messageId: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  body: string;
}) {
  return {
    workspaceId: event.workspaceId,
    channelId: event.channelId,
    recipientStrategy: "mentions-only",
    sourceMessageId: event.messageId,
  };
}
```

```ts
// services/search-service/src/consumers/message-sent-consumer.ts
export function createSearchDocumentFromMessageSent(event: {
  type: "chat.message.sent";
  messageId: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  body: string;
}) {
  return {
    id: event.messageId,
    workspaceId: event.workspaceId,
    channelId: event.channelId,
    senderId: event.senderId,
    body: event.body,
  };
}
```

`services/notification-service/src/app.ts` and `services/search-service/src/app.ts` should each compose their consumer helper into a small service runtime object so later queue wiring has a stable entrypoint.

Both package manifests should use honest stage-appropriate scripts rather than placeholder success commands.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @services/notification-service vitest src/consumers/message-sent-consumer.test.ts`
Expected: PASS

Run: `pnpm --filter @services/search-service vitest src/consumers/message-sent-consumer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/notification-service services/search-service
git commit -m "feat: add async notification and search consumers"
```

## Task 9: Add The Frontend Vertical Slice

**Files:**
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/features/chat/chat-page.tsx`
- Create: `apps/web/src/features/chat/use-send-message.ts`
- Test: `apps/web/src/features/chat/chat-page.test.tsx`

- [ ] **Step 1: Write the failing chat page test**

```tsx
// apps/web/src/features/chat/chat-page.test.tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatPage } from "./chat-page";

describe("ChatPage", () => {
  it("renders seeded history from the gateway client", async () => {
    render(
      <ChatPage
        loadMessages={async () => [
          { id: "msg_1", senderName: "Ava", body: "Morning team" },
          { id: "msg_2", senderName: "Noah", body: "Shipping today" },
        ]}
        sendMessage={async () => undefined}
      />,
    );

    expect(await screen.findByText("Morning team")).toBeInTheDocument();
    expect(screen.getByText("Shipping today")).toBeInTheDocument();
  });

  it("sends the drafted message through the gateway client", async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);

    render(
      <ChatPage
        loadMessages={async () => []}
        sendMessage={sendMessage}
      />,
    );

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "hello team" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith("hello team");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @apps/web vitest src/features/chat/chat-page.test.tsx`
Expected: FAIL because `ChatPage` does not exist.

- [ ] **Step 3: Write the minimal chat page**

```tsx
// apps/web/src/features/chat/chat-page.tsx
import { useEffect, useState } from "react";
import { useSendMessage } from "./use-send-message";

export interface ChatMessage {
  id: string;
  senderName: string;
  body: string;
}

export function ChatPage(props: {
  loadMessages: () => Promise<ChatMessage[]>;
  sendMessage: (body: string) => Promise<ChatMessage>;
}) {
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSending, submitMessage } = useSendMessage(props.sendMessage);

  useEffect(() => {
    void props.loadMessages().then((nextMessages) => {
      setMessages(nextMessages);
      setIsLoading(false);
    });
  }, [props]);

  return (
    <div>
      <header>Product Chat</header>
      <section>
        {isLoading ? (
          <p>Loading conversation…</p>
        ) : (
          messages.map((message) => (
            <article key={message.id}>
              <strong>{message.senderName}</strong>
              <p>{message.body}</p>
            </article>
          ))
        )}
      </section>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const nextMessage = await submitMessage(body);
          setMessages((current) => [...current, nextMessage]);
          setBody("");
        }}
      >
        <label>
          Message
          <input value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" disabled={isSending}>Send</button>
      </form>
    </div>
  );
}
```

`apps/web/src/features/chat/use-send-message.ts` should own the async send/pending-state behavior, while `ChatPage` owns layout, draft state, initial history loading, and appending the newly sent message into the visible conversation.

The page should be product-shaped, not just a bare form: seeded history in a conversation pane, a small product header, and a sticky-feeling composer layout that can plausibly evolve into the real app shell later.

`apps/web/package.json` should include the minimum realistic frontend dependencies for this slice and use honest scripts instead of placeholder success commands.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @apps/web vitest src/features/chat/chat-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat: add frontend chat vertical slice"
```

## Task 10: Add Baseline Observability, CI, And Runtime Documentation

**Files:**
- Create: `packages/observability/src/logger.ts`
- Create: `packages/observability/src/tracing.ts`
- Create: `.github/workflows/ci.yml`
- Create: `docs/architecture/runtime-topology.md`
- Test: `packages/observability/src/logger.test.ts`

- [ ] **Step 1: Write the failing logger test**

```ts
// packages/observability/src/logger.test.ts
import { describe, expect, it } from "vitest";
import { createLogger } from "./logger";

describe("createLogger", () => {
  it("includes the service name in every log payload", () => {
    const logger = createLogger("chat-service");
    expect(logger.info("booted")).toMatchObject({
      level: "info",
      service: "chat-service",
      message: "booted",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest packages/observability/src/logger.test.ts`
Expected: FAIL because the logger helper does not exist.

- [ ] **Step 3: Write minimal observability and CI definitions**

```ts
// packages/observability/src/logger.ts
export function createLogger(service: string) {
  return {
    info(message: string) {
      return {
        level: "info" as const,
        service,
        message,
      };
    },
  };
}
```

```yaml
# .github/workflows/ci.yml
name: ci

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.8.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @packages/testing test
      - run: pnpm --filter @team-chat/contracts test
      - run: pnpm --filter @team-chat/config test
      - run: pnpm --filter @team-chat/observability test
      - run: pnpm --filter @services/identity-service test
      - run: pnpm --filter @services/chat-service test
      - run: pnpm --filter @services/api-gateway test
      - run: pnpm --filter @services/realtime-gateway test
      - run: pnpm --filter @services/notification-service test
      - run: pnpm --filter @services/search-service test
      - run: pnpm --filter @apps/web test
```

```md
# docs/architecture/runtime-topology.md

## Initial runtime

[web] -> [api-gateway] -> [identity-service]
                      -> [chat-service]

[chat-service] -> event bus / queue -> [realtime-gateway]
                                  -> [notification-service]
                                  -> [search-service]
```

`packages/observability/package.json` should behave like a real shared package, not a placeholder service package: add an explicit package entrypoint, real package `build`, `lint`, `typecheck`, and `test` scripts, and matching `tsconfig` files the same way `packages/contracts` and `packages/config` do.

`packages/observability/src/tracing.ts` should provide a minimal trace/span context helper that can be shared across services later, even if it is only returning structured metadata for now.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest packages/observability/src/logger.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/observability .github/workflows/ci.yml docs/architecture/runtime-topology.md
git commit -m "chore: add observability baseline and ci"
```

## Task 11: Verify The First End-To-End Slice

**Files:**
- Modify: `docs/runbooks/local-development.md`
- Create: `apps/web/e2e/chat-smoke.spec.ts`
- Create: `apps/web/playwright.config.ts`
- Test: `apps/web/e2e/chat-smoke.spec.ts`

- [ ] **Step 1: Write the failing Playwright smoke test**

```ts
// apps/web/e2e/chat-smoke.spec.ts
import { expect, test } from "@playwright/test";

test("send message flow", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByLabel("Message").fill("hello from e2e");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("hello from e2e")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @apps/web playwright test apps/web/e2e/chat-smoke.spec.ts`
Expected: FAIL until the frontend package has Playwright wiring and the local runbook documents how to start the app for browser-based verification.

- [ ] **Step 3: Wire the browser smoke layer around the existing chat slice**

Create `apps/web/playwright.config.ts` with a minimal local-web setup for the `apps/web/e2e` specs, and keep `apps/web/src/App.tsx` as the product-shaped seeded-history conversation slice already introduced in Task 9. The e2e test should verify the actual visible conversation loop in that page instead of introducing a second message list outside `ChatPage`.

Update `apps/web/package.json` to include the Playwright dependency and an honest `e2e` script.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @apps/web vitest src/features/chat/chat-page.test.tsx`
Expected: PASS

Run: `pnpm --filter @apps/web playwright test apps/web/e2e/chat-smoke.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/e2e/chat-smoke.spec.ts apps/web/playwright.config.ts apps/web/package.json docs/runbooks/local-development.md
git commit -m "test: verify first end-to-end chat flow"
```

## Spec Coverage Check

- product scope coverage in this plan:
  - channels: foundation only, full CRUD deferred
  - threads: deferred
  - direct messages: deferred
  - search: consumer projection foundation included
  - file attachments: deferred
  - notifications: consumer foundation included
  - presence: realtime gateway foundation included, full presence deferred
  - RBAC: workspace ownership and route validation foundation included
- architecture coverage in this plan:
  - business-domain service split: included
  - sync plus async communication: included
  - outbox-based side effects: included
  - gateway plus websocket runtime shape: included
  - observability baseline: included

## Placeholder Scan

This plan intentionally avoids unresolved placeholders and hand-wavy instructions. Each task names exact files, explicit commands, and concrete minimal code targets.

## Type Consistency Check

- HTTP request payload names are consistent across `SendMessageRequestSchema`, gateway route payloads, and chat service route payloads:
  - `workspaceId`
  - `channelId`
  - `senderId`
  - `body`
- event payload names are consistent across contracts and consumers:
  - `type`
  - `messageId`
  - `workspaceId`
  - `channelId`
  - `senderId`
  - `body`
