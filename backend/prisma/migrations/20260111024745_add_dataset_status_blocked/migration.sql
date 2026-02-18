-- CreateEnum
CREATE TYPE "DatasetStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'DRAFT');

-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "DatasetStatus" NOT NULL DEFAULT 'ACTIVE';
