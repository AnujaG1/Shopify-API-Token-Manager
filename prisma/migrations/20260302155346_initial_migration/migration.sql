-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedToken" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "delegateAccessTokenId" TEXT NOT NULL,
    "delegateAccessToken" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastUsed" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "chargeId" TEXT,

    CONSTRAINT "GeneratedToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorefrontToken" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "delegateAccessTokenId" TEXT NOT NULL,
    "delegateAccessToken" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastUsed" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "chargeId" TEXT,

    CONSTRAINT "StorefrontToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentCharge" (
    "id" SERIAL NOT NULL,
    "chargeId" TEXT NOT NULL,
    "tokenId" INTEGER,
    "tokenType" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedToken_delegateAccessTokenId_key" ON "GeneratedToken"("delegateAccessTokenId");

-- CreateIndex
CREATE INDEX "GeneratedToken_shop_idx" ON "GeneratedToken"("shop");

-- CreateIndex
CREATE INDEX "GeneratedToken_isActive_idx" ON "GeneratedToken"("isActive");

-- CreateIndex
CREATE INDEX "GeneratedToken_isPaid_idx" ON "GeneratedToken"("isPaid");

-- CreateIndex
CREATE UNIQUE INDEX "StorefrontToken_delegateAccessTokenId_key" ON "StorefrontToken"("delegateAccessTokenId");

-- CreateIndex
CREATE INDEX "StorefrontToken_shop_idx" ON "StorefrontToken"("shop");

-- CreateIndex
CREATE INDEX "StorefrontToken_isActive_idx" ON "StorefrontToken"("isActive");

-- CreateIndex
CREATE INDEX "StorefrontToken_isPaid_idx" ON "StorefrontToken"("isPaid");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCharge_chargeId_key" ON "PaymentCharge"("chargeId");

-- CreateIndex
CREATE INDEX "PaymentCharge_chargeId_idx" ON "PaymentCharge"("chargeId");

-- CreateIndex
CREATE INDEX "PaymentCharge_shop_idx" ON "PaymentCharge"("shop");
