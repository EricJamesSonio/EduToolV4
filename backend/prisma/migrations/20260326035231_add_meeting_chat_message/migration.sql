-- CreateTable
CREATE TABLE "MeetingChatMessage" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingChatMessage_pkey" PRIMARY KEY ("id")
);
