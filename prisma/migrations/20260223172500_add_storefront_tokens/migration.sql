-- CreateTable
CREATE TABLE "StorefrontToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "delegateAccessTokenId" TEXT NOT NULL,
    "delegateAccessToken" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "lastUsed" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "StorefrontToken_delegateAccessTokenId_key" ON "StorefrontToken"("delegateAccessTokenId");

-- CreateIndex
CREATE INDEX "StorefrontToken_shop_idx" ON "StorefrontToken"("shop");

-- CreateIndex
CREATE INDEX "StorefrontToken_isActive_idx" ON "StorefrontToken"("isActive");
