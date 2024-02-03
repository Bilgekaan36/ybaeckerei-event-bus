export const dbMigrationQueries = async (client: any) => {
  await client.query(`create extension if not exists "uuid-ossp";`);
  await client.query(
    `CREATE TABLE IF NOT EXISTS "Store"
    (
        "storeId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "storeTitle" VARCHAR(255) NOT NULL,
        "street" VARCHAR(255) NOT NULL,
        "postalCode" INT NOT NULL,
        city VARCHAR(255) NOT NULL
    );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "Billboard"
    (
        "billboardId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
        "billboardTitle" VARCHAR(255) NOT NULL, 
        "billboardImageUrl" VARCHAR(255) NOT NULL
    );`
  );

  await client.query(
    `CREATE TABLE IF NOT EXISTS "Category"
    (
        "categoryId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
        "categoryName" VARCHAR(255) NOT NULL, 
        "billboardId" UUID,
        FOREIGN KEY ("billboardId") REFERENCES "Billboard"("billboardId")
    );`
  );

  await client.query(
    `CREATE TABLE IF NOT EXISTS "Image"
    (
        "imageId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
        "imageTitle" VARCHAR(255) NOT NULL, 
        "imageUrl" VARCHAR(255) NOT NULL
    );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "BillboardImage"
    (
        "billboardId" UUID,
        "imageId" UUID, 
        FOREIGN KEY ("billboardId") REFERENCES "Billboard"("billboardId"),
        FOREIGN KEY ("imageId") REFERENCES "Image"("imageId")
    );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "Variant"
      (
        "variantId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "variantTitle" VARCHAR(255) NOT NULL
      );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "Size"
    (
        "sizeId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "sizeValue" SMALLINT NOT NULL,
        "sizeType" VARCHAR(255) NOT NULL
    );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "Product" 
      (
        "productId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productName" VARCHAR(255) NOT NULL,
        "productDescription" TEXT,
        "productPrice" DECIMAL(10, 2) NOT NULL,
        "stockQuantity" INT NOT NULL,
        "variantId" UUID,
        FOREIGN KEY ("variantId") REFERENCES "Variant"("variantId"),
        "categoryId" UUID,
        FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId")
      );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "ProductSize"
    (
        "productId" UUID,
        "sizeId" UUID,
        FOREIGN KEY ("productId") REFERENCES "Product"("productId"),
        FOREIGN KEY ("sizeId") REFERENCES "Size"("sizeId")
    );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "ProductVariant"
    (
        "productId" UUID,
        "variantId" UUID,
        FOREIGN KEY ("productId") REFERENCES "Product"("productId"),
        FOREIGN KEY ("variantId") REFERENCES "Variant"("variantId")
    );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "ProductImage"
    (
        "productId" UUID,
        "imageId" UUID,
        FOREIGN KEY ("productId") REFERENCES "Product"("productId"),
        FOREIGN KEY ("imageId") REFERENCES "Image"("imageId")
    );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "Customer"
    (
        "customerId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "firstName" VARCHAR(255) NOT NULL,
        "lastName" VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        "phoneNumber" VARCHAR(20),
        "shippingAddress" TEXT,
        "billingAddress" TEXT
    );`
  );

  await client.query(
    `CREATE TABLE IF NOT EXISTS "OrderStatus"
    (
        "statusId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "statusTitle" VARCHAR(255)
    );`
  );
  await client.query(
    `INSERT INTO "OrderStatus"("statusTitle") SELECT 'Ordered'
        WHERE NOT EXISTS 
        (
            SELECT 1 FROM "OrderStatus" WHERE "statusTitle"='Ordered'
        );`
  );
  await client.query(
    `INSERT INTO "OrderStatus"("statusTitle") SELECT 'Preparation'
        WHERE NOT EXISTS 
        (
            SELECT 1 FROM "OrderStatus" WHERE "statusTitle"='Preparation'
        );`
  );
  await client.query(
    `INSERT INTO "OrderStatus"("statusTitle") SELECT 'Collection'
        WHERE NOT EXISTS 
        (
            SELECT 1 FROM "OrderStatus" WHERE "statusTitle"='Collection'
        );`
  );
  await client.query(
    `INSERT INTO "OrderStatus"("statusTitle") SELECT 'Picked Up'
        WHERE NOT EXISTS 
        (
            SELECT 1 FROM "OrderStatus" WHERE "statusTitle"='Picked Up'
        );`
  );
  await client.query(
    `INSERT INTO "OrderStatus"("statusTitle") SELECT 'Canceled'
        WHERE NOT EXISTS 
        (
            SELECT 1 FROM "OrderStatus" WHERE "statusTitle"='Canceled'
        );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "Order"
    (
        "orderId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "customerId" UUID NOT NULL,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId"),
        "statusId" UUID NOT NULL,
        FOREIGN KEY ("statusId") REFERENCES "OrderStatus"("statusId"),
        "isPaid" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "OrderItem"
    (
        "orderItemId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderId" UUID NOT NULL,
        FOREIGN KEY ("orderId") REFERENCES "Order"("orderId"),
        "productId" UUID NOT NULL,
        FOREIGN KEY ("productId") REFERENCES "Product"("productId"),
        quantity INT NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL
    );`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS "Review"
    (
        "reviewId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        rating INT NOT NULL,
        comment TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        "productId" UUID NOT NULL,
        FOREIGN KEY ("productId") REFERENCES "Product"("productId"),
        "customerId" UUID NOT NULL, 
        FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId")
    );`
  );
};
