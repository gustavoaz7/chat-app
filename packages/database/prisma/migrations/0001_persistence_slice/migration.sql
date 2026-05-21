CREATE TABLE "workspaces" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "defaultChannelId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "channels" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outbox_events" (
  "id" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "payloadJson" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),

  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "channels_workspaceId_idx" ON "channels"("workspaceId");
CREATE UNIQUE INDEX "channels_id_workspaceId_key" ON "channels"("id", "workspaceId");

CREATE INDEX "messages_workspaceId_channelId_createdAt_idx" ON "messages"("workspaceId", "channelId", "createdAt");

ALTER TABLE "channels"
ADD CONSTRAINT "channels_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_channelId_workspaceId_fkey"
FOREIGN KEY ("channelId", "workspaceId") REFERENCES "channels"("id", "workspaceId")
ON DELETE RESTRICT ON UPDATE CASCADE;
