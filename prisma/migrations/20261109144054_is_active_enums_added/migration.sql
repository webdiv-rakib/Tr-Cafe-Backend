-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED', 'UNBAN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
