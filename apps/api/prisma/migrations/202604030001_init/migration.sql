CREATE TYPE "CategoryStatus" AS ENUM ('ENABLED', 'DISABLED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'COMPLETED');
CREATE TYPE "UserRole" AS ENUM ('END_USER', 'MERCHANT_ADMIN', 'SUPER_ADMIN');

CREATE TABLE "Shop" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subtitle" TEXT NOT NULL,
  "avatarLabel" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "account" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "refreshTokenHash" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'END_USER',
  "shopId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuCategory" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "status" "CategoryStatus" NOT NULL DEFAULT 'ENABLED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Recipe" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "badge" TEXT,
  "cover" TEXT,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "price" INTEGER NOT NULL DEFAULT 0,
  "sales" INTEGER NOT NULL DEFAULT 0,
  "stock" INTEGER NOT NULL DEFAULT 999,
  "isOnline" BOOLEAN NOT NULL DEFAULT true,
  "tags" JSONB,
  "thumbTone" TEXT NOT NULL DEFAULT '#f8d59c',
  "thumbAccent" TEXT NOT NULL DEFAULT '#d38852',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cart" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "shopId" TEXT,
  "lastOrderId" TEXT,
  "lastSubmittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "categoryName" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "badge" TEXT,
  "price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "stock" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "thumbTone" TEXT NOT NULL,
  "thumbAccent" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "orderNo" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "shopName" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "itemCount" INTEGER NOT NULL,
  "totalQuantity" INTEGER NOT NULL,
  "totalAmount" INTEGER NOT NULL,
  "paidAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "categoryName" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "badge" TEXT,
  "price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "lineAmount" INTEGER NOT NULL,
  "thumbTone" TEXT NOT NULL,
  "thumbAccent" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_account_key" ON "User"("account");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_shopId_idx" ON "User"("shopId");
CREATE INDEX "MenuCategory_shopId_idx" ON "MenuCategory"("shopId");
CREATE INDEX "Recipe_shopId_idx" ON "Recipe"("shopId");
CREATE INDEX "Recipe_categoryId_idx" ON "Recipe"("categoryId");
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_shopId_idx" ON "Order"("shopId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

ALTER TABLE "MenuCategory"
ADD CONSTRAINT "MenuCategory_shopId_fkey"
FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Recipe"
ADD CONSTRAINT "Recipe_shopId_fkey"
FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Recipe"
ADD CONSTRAINT "Recipe_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_cartId_fkey"
FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
