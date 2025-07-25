-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shop" TEXT NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSkuMapping" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractSkuMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignedContract" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "orderId" TEXT,
    "customerEmail" TEXT,
    "customerName" TEXT,
    "signatureData" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "shop" TEXT NOT NULL,

    CONSTRAINT "SignedContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractSkuMapping_contractId_sku_key" ON "ContractSkuMapping"("contractId", "sku");

-- AddForeignKey
ALTER TABLE "ContractSkuMapping" ADD CONSTRAINT "ContractSkuMapping_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignedContract" ADD CONSTRAINT "SignedContract_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
