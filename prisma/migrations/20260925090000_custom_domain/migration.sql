-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "customDomainVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Business_customDomain_key" ON "Business"("customDomain");
