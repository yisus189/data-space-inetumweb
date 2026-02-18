-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "odrlPolicy" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;
