-- Durable outbox for connector control-plane retries
CREATE TYPE "ConnectorOutboxStatus" AS ENUM ('PENDING', 'RETRYING', 'FAILED', 'COMPLETED');

CREATE TABLE "ConnectorOutbox" (
  "id" SERIAL NOT NULL,
  "operation" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "context" JSONB,
  "reason" TEXT,
  "status" "ConnectorOutboxStatus" NOT NULL DEFAULT 'PENDING',
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "lastTriedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ConnectorOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConnectorOutbox_status_createdAt_idx" ON "ConnectorOutbox"("status", "createdAt");
