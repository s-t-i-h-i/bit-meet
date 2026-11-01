/*
  Warnings:

  - You are about to drop the column `finalSlot` on the `Event` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dates" TEXT NOT NULL,
    "finalStart" TEXT,
    "finalEnd" TEXT,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "slotMinutes" INTEGER NOT NULL,
    "timeZone" TEXT NOT NULL,
    "adminTokenHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Event" ("adminTokenHash", "createdAt", "dates", "endMinutes", "id", "name", "slotMinutes", "slug", "startMinutes", "timeZone") SELECT "adminTokenHash", "createdAt", "dates", "endMinutes", "id", "name", "slotMinutes", "slug", "startMinutes", "timeZone" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
