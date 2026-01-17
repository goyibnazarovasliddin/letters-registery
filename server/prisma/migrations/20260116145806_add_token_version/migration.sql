/*
  Warnings:

  - You are about to drop the column `letterNumber` on the `Letter` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "allowPastDates" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Letter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "letterDate" TEXT NOT NULL,
    "indexId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "pageCount" INTEGER NOT NULL,
    "attachmentPageCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Letter_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Index" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Letter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Letter" ("attachmentPageCount", "content", "createdAt", "id", "indexId", "letterDate", "pageCount", "recipient", "status", "subject", "updatedAt", "userId") SELECT "attachmentPageCount", "content", "createdAt", "id", "indexId", "letterDate", "pageCount", "recipient", "status", "subject", "updatedAt", "userId" FROM "Letter";
DROP TABLE "Letter";
ALTER TABLE "new_Letter" RENAME TO "Letter";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "departmentId" TEXT,
    "mustChangePasswordOnNextLogin" BOOLEAN NOT NULL DEFAULT false,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "deletedAt", "departmentId", "fullName", "id", "mustChangePasswordOnNextLogin", "password", "position", "role", "status", "updatedAt", "username") SELECT "createdAt", "deletedAt", "departmentId", "fullName", "id", "mustChangePasswordOnNextLogin", "password", "position", "role", "status", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
