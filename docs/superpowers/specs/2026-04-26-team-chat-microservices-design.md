# Team Chat Microservices Design

## Goal

Design a team chat application for learning full-stack and architecture skills with an emphasis on production realism, clean scalability, and business-domain-oriented microservices.

The project should teach:

- backend application design
- service boundaries and contracts
- realtime communication
- async/event-driven workflows
- data modeling and consistency tradeoffs
- deployment and infrastructure concerns
- observability and operational thinking

The project should not optimize for end-to-end encryption in the initial version. Cryptography is intentionally deprioritized so the architecture can focus on broader platform learning.

## Product Scope

The product is a team chat application for a growing SaaS context. The initial architecture target includes:

- channels
- threads
- direct messages
- search
- file attachments
- notifications
- presence
- RBAC

This is a single product with meaningful depth rather than a broader multi-product platform.

## Why This Project

A team chat application is a strong learning vehicle because it naturally spans:

- a rich front-end client
- authentication and authorization
- relational data modeling
- websocket-based realtime systems
- background jobs and retries
- search indexing
- object storage
- observability
- CI/CD and deployment

It provides better architecture breadth than a purely CRUD-oriented product and introduces production-style tradeoffs without requiring unusually specialized domains.

## Architectural Style

The project will use a small, intentional microservice architecture organized around business domains.

This choice is deliberate. Another existing learning project already explores a modular monolith, so this project should expose distributed-system concerns directly:

- service boundaries
- event-driven integration
- partial failure handling
- contract design
- independent deployment concerns
- cross-service observability

The architecture should still avoid unnecessary fragmentation. The system should use a handful of well-defined services rather than many small services.

## Service Topology

The recommended service layout is:

- `Identity & Workspace`
- `Chat Core`
- `Realtime Gateway`
- `Notification Service`
- `Search Service`
- `API Gateway / BFF`

High-level runtime shape:

```text
                +----------------------+
                |     Web Frontend     |
                +----------+-----------+
                           |
                    HTTPS / REST
                           |
                 +---------v---------+
                 |  API Gateway/BFF  |
                 +----+----------+---+
                      |          |
          +-----------+          +-------------+
          |                                     |
+---------v----------+                +---------v---------+
| Identity & Workspace|                |    Chat Core     |
+---------------------+                +------------------+
                                                |
                                           publishes events
                                                |
                                  +-------------+-------------+
                                  |             |             |
                        +---------v----+ +------v------+ +----v------+
                        | Realtime GW  | | Notifications| | Search    |
                        +--------------+ +-------------+ +-----------+
```

## Service Responsibilities

### API Gateway / BFF

The API Gateway / BFF is the frontend-facing entry point for synchronous HTTP traffic.

Responsibilities:

- authenticate incoming requests
- route requests to the correct backend services
- compose responses when needed
- provide a frontend-friendly API surface
- enforce coarse-grained rate limiting and request policies

It should avoid containing core business logic. Domain rules belong in the domain services.

### Identity & Workspace

This service is the source of truth for identity and access control.

Responsibilities:

- users
- workspaces
- memberships
- invitations
- roles and permissions
- auth/session metadata

It answers:

- who is this user?
- what workspace do they belong to?
- what are they allowed to do?

### Chat Core

This is the canonical source of truth for conversation data and chat rules.

Responsibilities:

- channels
- DMs
- threads
- messages
- reactions
- read/unread state
- conversation membership rules tied to workspace identity context

This service owns the critical synchronous path for sending and retrieving chat data.

### Realtime Gateway

This service manages live websocket traffic and connection state.

Responsibilities:

- websocket connection lifecycle
- connection authentication
- subscription state
- presence tracking
- event fan-out to connected clients

It should not become the source of truth for durable message state. It is a delivery layer, not the canonical data owner.

### Notification Service

This service manages asynchronous outbound notification workflows.

Responsibilities:

- mention notifications
- email and push delivery
- notification preferences
- retry and backoff policies
- delivery attempt tracking

It should react to events rather than sit in the synchronous request path for message creation.

### Search Service

This service owns denormalized search projections and search query behavior.

Responsibilities:

- indexing messages and relevant metadata
- indexing channels and possibly files
- serving search queries over denormalized search documents
- replaying and rebuilding indexes when needed

It does not own canonical chat records.

## Data Ownership

Each service owns its own data and exposes it through APIs or events rather than shared table access. Even if services initially share a Postgres cluster, the architecture should behave as though each service has a private database.

Recommended ownership:

```text
Identity & Workspace DB
- users
- workspaces
- memberships
- roles
- invitations
- auth/session metadata

Chat Core DB
- channels
- channel_memberships
- conversations
- messages
- threads
- reactions
- read_states

Notification DB
- notification_preferences
- notification_jobs
- delivery_attempts

Search Index
- denormalized message/channel documents

Realtime state
- ephemeral connection/session/presence data in Redis
```

This separation teaches the right mental model for service autonomy and prevents hidden coupling through direct database reads.

## Communication Model

The system should use a mix of synchronous APIs and asynchronous events.

### Synchronous calls

Use synchronous communication when the user is waiting on an immediate result:

- `API Gateway -> Identity & Workspace`
- `API Gateway -> Chat Core`
- `Realtime Gateway -> Identity & Workspace` for auth and authorization checks
- `Realtime Gateway -> Chat Core` only when current authoritative data is needed

### Asynchronous events

Use asynchronous communication for fan-out and side effects:

- `MessageSent`
- `MessageEdited`
- `MessageDeleted`
- `ChannelCreated`
- `MemberAdded`
- `MentionCreated`
- `MemberRemoved`
- `RoleChanged`

These events are consumed by:

- `Realtime Gateway`
- `Notification Service`
- `Search Service`

This split keeps the core user experience responsive while still teaching eventual consistency and downstream processing.

## Runtime Infrastructure

Recommended shared infrastructure:

- Postgres for durable relational data
- Redis for presence, ephemeral state, and rate-limiting support
- message broker or queue for events and background jobs
- object storage for attachments
- centralized logs
- metrics and dashboards
- distributed tracing
- containerized deployment
- orchestration platform for running services

This stack is large enough to be production-realistic without being excessively enterprise-heavy.

## Core Flows

### Send message

```text
1. Frontend -> API Gateway
2. Gateway authenticates user via identity context
3. Gateway calls Chat Core
4. Chat Core validates membership and permissions
5. Chat Core writes message to Postgres
6. Chat Core records/publishes a MessageSent event
7. Realtime Gateway pushes to connected clients
8. Notification Service evaluates notification rules
9. Search Service updates the index
```

The critical success condition is the canonical write in `Chat Core`. Realtime, notification, and search behavior should follow asynchronously.

### Websocket connect

```text
1. Frontend opens websocket to Realtime Gateway
2. Realtime Gateway validates token/session
3. Realtime Gateway resolves workspace/channel permissions
4. Connection state is registered in Redis or another ephemeral store
5. Presence signals are emitted as needed
6. Client subscribes to live updates for authorized conversations
```

### Recovery after missed realtime events

```text
1. Client reconnects
2. Realtime Gateway reauthenticates and restores subscriptions
3. Client requests recent canonical state from Chat Core
4. UI reconciles missed messages/unread state from durable data
```

This avoids over-trusting websocket delivery as a perfect ledger.

## Reliability And Failure Handling

The architecture should assume:

- downstream services can be unavailable
- messages can be delivered more than once
- consumers can lag behind producers
- websocket pushes can be missed

The critical synchronous path is:

- authentication
- authorization
- canonical chat write

The non-critical asynchronous path is:

- websocket fan-out
- notifications
- search indexing
- analytics or audit side effects

Implications:

- if notifications are down, sending a message still succeeds
- if search is behind, search is stale but chat is correct
- if realtime delivery fails, reconnect plus backfill restores correctness
- if an event is duplicated, consumers must safely ignore or coalesce duplicates

Recommended resilience mechanisms:

- outbox pattern in `Chat Core`
- idempotent event consumers
- retries with backoff
- dead-letter queue for poison messages
- correlation IDs across requests and events
- rate limiting at gateway and websocket entry points
- audit logging for sensitive admin/workspace actions

Resilience shape:

```text
[Chat Core write]
     |
     +--> DB commit
     |
     +--> outbox record
             |
             +--> broker
                    |
        +-----------+-----------+
        |           |           |
   [Realtime] [Notify]    [Search]
        |           |           |
   idempotent   retry/DLQ   replay/reindex
```

## Scalability Posture

The target is a growing SaaS with thousands of concurrent users, not a multi-region global messaging platform.

This means the design should support:

- horizontal scaling of stateless services
- partition-aware growth in message-heavy workloads
- independent scaling of websocket infrastructure
- operational visibility into bottlenecks
- controlled use of eventual consistency

This design intentionally does not optimize upfront for:

- multi-region active-active architecture
- extreme global scale
- advanced cryptographic protocols

Those can be treated as later evolutions rather than initial constraints.

## Security Posture

Initial security focus should be on mainstream application security and service trust boundaries:

- secure authentication and session handling
- role-based access control
- workspace and channel authorization checks
- secure secret management
- attachment access control
- auditability of administrative actions
- encrypted transport between clients and services

End-to-end encryption is explicitly out of scope for the first version. It can be introduced later as a distinct learning milestone once the platform architecture is stable.

## Testing Strategy

Testing should reflect both application correctness and distributed-system behavior.

### Unit tests

- domain rules
- authorization decisions
- message/thread/unread behavior
- notification decision logic

### Integration tests

- service plus database
- service plus Redis
- outbox behavior
- event consumer behavior

### Contract tests

- Gateway to service API contracts
- producer and consumer event schemas

### End-to-end tests

- login
- create workspace/channel
- send message
- reply in thread
- mention another user
- reconnect and recover missed updates

### Operational behavior tests

- duplicate event handling
- delayed consumer behavior
- service restart behavior
- websocket reconnect and re-subscription

This testing approach supports both development confidence and architectural learning.

## Why Not Start With A Modular Monolith

For this specific project, microservices are chosen intentionally to contrast with an existing modular-monolith learning project.

The goal is to learn:

- domain-driven service boundaries
- async communication
- eventual consistency
- deployment choreography
- tracing across distributed systems
- operational debugging across service boundaries

A team chat system has natural boundaries that make this service split teachable without requiring an excessive number of services.

## Suggested Future Evolutions

Reasonable later milestones include:

- attachment/media processing service
- analytics/audit pipeline
- multi-tenant billing or plan enforcement
- end-to-end encryption exploration
- multi-region strategy
- service decomposition adjustments based on observed pain

These should follow demonstrated need rather than being built into the first implementation wave.

## Implementation Guidance

Keep the first implementation disciplined:

- choose a single clear source of truth per concern
- keep the synchronous path small
- push side effects into async consumers
- prefer explicit contracts over convenience coupling
- instrument the system from the start
- build recovery paths for missed realtime delivery

The goal is not to mimic a hyperscale architecture. The goal is to build a system that is realistic, understandable, and rich enough to teach full-stack architecture well.
