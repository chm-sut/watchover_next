-- CreateTable
CREATE TABLE "jira_tickets" (
    "ticketId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assignee" TEXT,
    "assigneeEmail" TEXT,
    "reporter" TEXT,
    "reporterEmail" TEXT,
    "customer" TEXT,
    "createDate" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jira_tickets_pkey" PRIMARY KEY ("ticketId")
);

-- CreateTable
CREATE TABLE "escalations" (
    "ticketId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "sentTime" TIMESTAMP(3),
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("ticketId","level")
);

-- CreateTable
CREATE TABLE "customers" (
    "objectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objectKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("objectId")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "jira_tickets"("ticketId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "jira_tickets"("ticketId") ON DELETE CASCADE ON UPDATE CASCADE;
