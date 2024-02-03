type Constructor<T = any> = new (...args: any[]) => T;

import {
  IBillboard,
  ICategory,
  ICustomer,
  IImage,
  IProduct,
  ISize,
  IStore,
  IVariant,
} from 'lib/types/api';

export function registrationMethods<T extends Constructor>(
  base: T
): Constructor & T {
  return class extends base {
    constructor(...args: any[]) {
      super(...args);
    }

    async registerStore({ storeTitle, street, postalCode, city }: IStore) {
      // SQL query for SELECT to check for existing data
      const selectQuery = `
          SELECT "storeTitle"
          FROM "Store"
          WHERE "storeTitle" = $1;
          `;

      // SQL query for INSERT
      const insertQuery = `
          INSERT INTO "Store"("storeTitle", "street", "postalCode", city) 
          VALUES ($1, $2, $3, $4)
          `;

      // Execute the SELECT query
      const foundedStore = await this.pool.query(selectQuery, [storeTitle]);
      // Check if data already exists
      if (foundedStore.rows.length > 0) {
        throw new Error('Store already exists.');
      } else {
        // Execute the INSERT query if data doesn't exist
        await this.pool.query(insertQuery, [
          storeTitle,
          street,
          postalCode,
          city,
        ]);
      }
    }

    async registerCategory({ categoryName, billboardId }: ICategory) {
      // SQL query for SELECT to check for existing data
      const selectQuery = `
          SELECT "categoryName"
          FROM "Category"
          WHERE "categoryName" = $1;
          `;

      // SQL query for INSERT
      const insertQuery = `
          INSERT INTO "Category"("categoryName", "billboardId") 
          VALUES ($1, $2)
          `;

      // Execute the SELECT query
      const foundedCategory = await this.pool.query(selectQuery, [
        categoryName,
      ]);
      // Check if data already exists
      if (foundedCategory.rows.length > 0) {
        throw new Error('Category already exists.');
      } else {
        // Execute the INSERT query if data doesn't exist
        await this.pool.query(insertQuery, [categoryName, billboardId]);
      }
    }

    async registerVariant({ variantTitle }: IVariant) {
      // SQL query for SELECT to check for existing data
      const selectQuery = `
          SELECT "variantTitle"
          FROM "Variant"
          WHERE "variantTitle" = $1;
          `;

      // SQL query for INSERT
      const insertQuery = `
          INSERT INTO "Variant"("variantTitle") 
          VALUES ($1)
          `;

      // Execute the SELECT query
      const foundedVariant = await this.pool.query(selectQuery, [variantTitle]);
      // Check if data already exists
      if (foundedVariant.rows.length > 0) {
        throw new Error('Variant already exists.');
      } else {
        // Execute the INSERT query if data doesn't exist
        await this.pool.query(insertQuery, [variantTitle]);
      }
    }

    async registerSize({ sizeValue, sizeType }: ISize) {
      // SQL query for SELECT to check for existing data
      const selectQuery = `
          SELECT "sizeValue", "sizeType"
          FROM "Size"
          WHERE "sizeValue" = $1
          AND "sizeType" = $2;
          `;

      // SQL query for INSERT
      const insertQuery = `
          INSERT INTO "Size"("sizeValue", "sizeType") 
          VALUES ($1, $2)
          `;

      // Execute the SELECT query
      const foundedCategory = await this.pool.query(selectQuery, [
        sizeValue,
        sizeType,
      ]);
      // Check if data already exists
      if (foundedCategory.rows.length > 0) {
        throw new Error('Size already exists.');
      } else {
        // Execute the INSERT query if data doesn't exist
        await this.pool.query(insertQuery, [sizeValue, sizeType]);
      }
    }

    async registerImage({ imageTitle, imageUrl }: IImage) {
      // SQL query for SELECT to check for existing data
      const selectQuery = `
          SELECT "imageTitle"
          FROM "Image"
          WHERE "imageTitle" = $1;
          `;

      // SQL query for INSERT
      const insertQuery = `
          INSERT INTO "Image"("imageTitle", "imageUrl") 
          VALUES ($1, $2)
          `;

      // Execute the SELECT query
      const foundedImage = await this.pool.query(selectQuery, [imageTitle]);
      // Check if data already exists
      if (foundedImage.rows.length > 0) {
        throw new Error('Image already exists.');
      } else {
        // Execute the INSERT query if data doesn't exist
        await this.pool.query(insertQuery, [imageTitle, imageUrl]);
      }
    }

    async registerBillboard({ billboardTitle, billboardImageUrl }: IBillboard) {
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        // SQL query for SELECT to check for existing data
        const selectQuery = `
          SELECT "billboardTitle", "billboardImageUrl"
          FROM "Billboard"
          WHERE "billboardTitle" = $1 AND "billboardImageUrl" = $2
          FOR UPDATE;
        `;

        const selectResult = await client.query(selectQuery, [
          billboardTitle,
          billboardImageUrl,
        ]);

        if (selectResult.rows.length === 0) {
          // SQL query for INSERT
          const insertQuery = `
            INSERT INTO "Billboard"("billboardTitle", "billboardImageUrl") 
            VALUES ($1, $2);
          `;

          // Execute the INSERT query
          await client.query(insertQuery, [billboardTitle, billboardImageUrl]);
          console.log('Billboard successfully registered.');
        } else {
          console.log('Billboard already exists.');
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        //@ts-ignore
        console.error('Error registering billboard:', error.message);
      } finally {
        client.release();
      }
    }

    async registerProduct({
      productName,
      productDescription,
      productPrice,
      stockQuantity,
      variantId,
      categoryId,
    }: IProduct) {
      // SQL query for SELECT to check for existing data
      const selectQuery = `
          SELECT "productName"
          FROM "Product"
          WHERE "productName" = $1;
          `;

      // SQL query for INSERT
      const insertQuery = `
          INSERT INTO "Product"("productName", "productDescription", "productPrice", "stockQuantity", "variantId", "categoryId") 
          VALUES ($1, $2, $3, $4, $5, $6)
          `;

      // Execute the SELECT query
      const foundedProduct = await this.pool.query(selectQuery, [productName]);
      // Check if data already exists
      if (foundedProduct.rows.length > 0) {
        throw new Error('Product already exists.');
      } else {
        // Execute the INSERT query if data doesn't exist
        await this.pool.query(insertQuery, [
          productName,
          productDescription,
          productPrice,
          stockQuantity,
          variantId,
          categoryId,
        ]);
      }
    }

    async registerCustomer({
      firstName,
      lastName,
      email,
      phoneNumber,
    }: ICustomer) {
      // SQL query for SELECT to check for existing data
      const selectQuery = `
          SELECT "firstName", "lastName"
          FROM "Customer"
          WHERE "firstName" = $1
          AND "lastName" = $2;
          `;

      // SQL query for INSERT
      const insertQuery = `
          INSERT INTO "Customer"("firstName", "lastName", email, "phoneNumber") 
          VALUES ($1, $2, $3, $4)
          `;

      // Execute the SELECT query
      const foundedCustomer = await this.pool.query(selectQuery, [
        firstName,
        lastName,
      ]);
      // Check if data already exists
      if (foundedCustomer.rows.length > 0) {
        throw new Error('Customer already exists.');
      } else {
        // Execute the INSERT query if data doesn't exist
        await this.pool.query(insertQuery, [
          firstName,
          lastName,
          email,
          phoneNumber,
        ]);
      }
    }
  };
}
