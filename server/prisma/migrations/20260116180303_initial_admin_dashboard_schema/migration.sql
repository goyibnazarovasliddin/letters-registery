-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Letter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "letterDate" TEXT NOT NULL,
    "indexId" TEXT,
    "recipient" TEXT,
    "subject" TEXT,
    "content" TEXT,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "attachmentPageCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Letter_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Index" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Letter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Letter" ("attachmentPageCount", "content", "createdAt", "id", "indexId", "letterDate", "pageCount", "recipient", "status", "subject", "updatedAt", "userId") SELECT "attachmentPageCount", "content", "createdAt", "id", "indexId", "letterDate", "pageCount", "recipient", "status", "subject", "updatedAt", "userId" FROM "Letter";
DROP TABLE "Letter";
ALTER TABLE "new_Letter" RENAME TO "Letter";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
