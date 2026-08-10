-- CreateEnum
CREATE TYPE "GroupyMessageType" AS ENUM ('text', 'gif', 'sticker', 'poll', 'system');

-- CreateEnum
CREATE TYPE "GroupyReactionType" AS ENUM ('like', 'love', 'laugh', 'wow', 'sad');

-- CreateTable
CREATE TABLE "GroupyMessage" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "sender_account_id" TEXT NOT NULL,
    "sender_role" "Role" NOT NULL,
    "sender_name" TEXT NOT NULL,
    "type" "GroupyMessageType" NOT NULL,
    "body" TEXT,
    "gif_url" TEXT,
    "sticker_id" TEXT,
    "poll_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupyMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupyReaction" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "reaction_type" "GroupyReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupyReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupyPoll" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "closes_at" TIMESTAMP(3),
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupyPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupyPollOption" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "GroupyPollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupyPollVote" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupyPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupyMessage_poll_id_key" ON "GroupyMessage"("poll_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupyReaction_message_id_account_id_key" ON "GroupyReaction"("message_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupyPollVote_poll_id_account_id_key" ON "GroupyPollVote"("poll_id", "account_id");

-- AddForeignKey
ALTER TABLE "GroupyMessage" ADD CONSTRAINT "GroupyMessage_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupyMessage" ADD CONSTRAINT "GroupyMessage_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "GroupyPoll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupyReaction" ADD CONSTRAINT "GroupyReaction_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "GroupyMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupyPollOption" ADD CONSTRAINT "GroupyPollOption_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "GroupyPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupyPollVote" ADD CONSTRAINT "GroupyPollVote_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "GroupyPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupyPollVote" ADD CONSTRAINT "GroupyPollVote_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "GroupyPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
