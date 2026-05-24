import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1700000000000 implements MigrationInterface {
  name = "InitSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // -------- users --------
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "auth0Sub" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "name" varchar(255),
        "picture" varchar(500),
        "phone" varchar(32),
        "role" varchar(32) NOT NULL DEFAULT 'customer',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_auth0Sub" UNIQUE ("auth0Sub"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // -------- menu_items --------
    await queryRunner.query(`
      CREATE TABLE "menu_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(160) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "category" varchar(16) NOT NULL,
        "calories" int NOT NULL DEFAULT 0,
        "benefits" text[] NOT NULL DEFAULT '{}',
        "price" numeric(12,2) NOT NULL,
        "isAvailable" boolean NOT NULL DEFAULT true,
        "imageUrl" varchar(500),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // -------- products --------
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "sku" varchar(64) NOT NULL,
        "price" numeric(12,2) NOT NULL,
        "stock" int NOT NULL DEFAULT 0,
        "isPreorder" boolean NOT NULL DEFAULT false,
        "fulfillment" varchar(16) NOT NULL,
        "imageUrl" varchar(500),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku")
      )
    `);

    // -------- orders --------
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'pending',
        "fulfillment" varchar(16) NOT NULL,
        "paymentMethod" varchar(16) NOT NULL DEFAULT 'online',
        "deliveryAddress" varchar(500),
        "notes" varchar(500),
        "total" numeric(12,2) NOT NULL DEFAULT 0,
        "paymongoCheckoutId" varchar(128),
        "paymongoCheckoutUrl" varchar(500),
        "paidAt" timestamptz,
        "cashReceived" numeric(12,2),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_orders_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_userId" ON "orders" ("userId")`);

    // -------- order_items --------
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL,
        "itemType" varchar(16) NOT NULL,
        "itemId" uuid NOT NULL,
        "nameSnapshot" varchar(200) NOT NULL,
        "quantity" int NOT NULL,
        "unitPrice" numeric(12,2) NOT NULL,
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
