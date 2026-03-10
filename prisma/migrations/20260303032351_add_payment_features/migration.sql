/*
  Warnings:

  - A unique constraint covering the columns `[chargeId]` on the table `GeneratedToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GeneratedToken_chargeId_key" ON "GeneratedToken"("chargeId");

-- CreateIndex
CREATE INDEX "PaymentCharge_status_idx" ON "PaymentCharge"("status");
