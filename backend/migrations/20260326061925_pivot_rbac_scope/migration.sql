-- CreateEnum
CREATE TYPE "RequestScope" AS ENUM ('PERSONAL', 'BUILDING');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestStatus" ADD VALUE 'PENDING_HOA_APPROVAL';
ALTER TYPE "RequestStatus" ADD VALUE 'REJECTED';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PLATFORM_ADMIN';

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "scope" "RequestScope" NOT NULL DEFAULT 'PERSONAL';
