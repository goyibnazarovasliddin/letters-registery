-- AlterTable
ALTER TABLE "Letter" ADD COLUMN "letterNumber" TEXT;
ALTER TABLE "Letter" ADD COLUMN "registeredAt" DATETIME;

-- CreateTable
CREATE TABLE "YearCounter" (
    "year" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastSequence" INTEGER NOT NULL DEFAULT 0
);
