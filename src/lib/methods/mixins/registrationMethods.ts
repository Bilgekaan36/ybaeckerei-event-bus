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

    async registerSize(items: ISize[]) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

        // Step 1: Delete rows not present in the current state
        if (items.length > 0) {
          const deleteQuery = `
                    DELETE FROM "Size"
                    WHERE "sizeId" NOT IN (${items
                      .map((item) => `'${item.sizeId}'`)
                      .join(',')})
                `;
          await client.query(deleteQuery);

          // Step 2: Insert or update the current state
          for (const item of items) {
            const { sizeId, sizeType, sizeValue } = item;
            // SQL query for INSERT
            const insertQuery = `
            INSERT INTO "Size"("sizeId", "sizeType", "sizeValue") 
            VALUES ($1, $2, $3)
            ON CONFLICT ("sizeId") DO UPDATE
            SET "sizeType" = $2, "sizeValue" = $3;
          `;
            // Execute the INSERT query
            await client.query(insertQuery, [sizeId, sizeType, sizeValue]);
            console.log(
              `Size ${sizeValue + sizeType} successfully registered.`
            );
          }
        } else {
          // STEP 3: Delete all rows if the current state is empty
          const deleteSizeQuery = `DELETE FROM "Size"`;
          await client.query(deleteSizeQuery);
        }

        await client.query('COMMIT');
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error registering Size:', error.message);
      } finally {
        client.release();
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

    async registerBillboard(items: IBillboard[]) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

        // Step 1: Delete rows not present in the current state
        if (items.length > 0) {
          const deleteQuery = `
                    DELETE FROM "Billboard"
                    WHERE "billboardId" NOT IN (${items
                      .map((item) => `'${item.billboardId}'`)
                      .join(',')})
                `;
          await client.query(deleteQuery);

          // Step 2: Insert or update the current state
          for (const item of items) {
            const { billboardId, billboardTitle, billboardImageUrl } = item;
            // SQL query for INSERT
            const insertQuery = `
            INSERT INTO "Billboard"("billboardId", "billboardTitle", "billboardImageUrl") 
            VALUES ($1, $2, $3)
            ON CONFLICT ("billboardId") DO UPDATE
            SET "billboardTitle" = $2, "billboardImageUrl" = $3;
          `;
            // Execute the INSERT query
            await client.query(insertQuery, [
              billboardId,
              billboardTitle,
              billboardImageUrl,
            ]);
            console.log(`Billboard ${billboardTitle} successfully registered.`);
          }
        } else {
          // STEP 3: Delete all rows if the current state is empty
          const deleteBillboardQuery = `DELETE FROM "Billboard"`;
          await client.query(deleteBillboardQuery);
        }

        await client.query('COMMIT');
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error registering billboard:', error.message);
      } finally {
        client.release();
      }
    }

    async registerCategory(items: ICategory[]) {
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
        // Step 1: Delete rows not present in the current state
        if (items.length > 0) {
          const deleteQuery = `
            DELETE FROM "Category"
            WHERE "categoryId" NOT IN (${items
              .map((item) => `'${item.categoryId}'`)
              .join(',')})
        `;
          await client.query(deleteQuery);

          // Step 2: Insert or update the current state
          for (const item of items) {
            const { categoryId, categoryName, billboardId } = item;

            const billboardTitleQuery = `
            SELECT "billboardTitle"
            FROM "Billboard"
            WHERE "billboardId" = $1;
            `;

            const resultBillboardTitle = await client.query(
              billboardTitleQuery,
              [billboardId]
            );

            if (resultBillboardTitle.rows.length > 0) {
              const billboardTitle =
                resultBillboardTitle.rows[0].billboardTitle;

              // SQL query for UPDATE or INSERT
              const upsertQuery = `
              INSERT INTO "Category"("categoryId", "categoryName", "billboardTitle", "billboardId") 
              VALUES ($1, $2, $3, $4)
              ON CONFLICT("categoryId") DO UPDATE
              SET "categoryName" = $2, "billboardTitle" = $3, "billboardId" = $4
              `;

              // Execute the UPDATE or INSERT query
              await client.query(upsertQuery, [
                categoryId,
                categoryName,
                billboardTitle,
                billboardId,
              ]);
            } else {
              throw new Error('Billboard not found.');
            }

            console.log(`Category ${categoryName} successfully registered.`);
          }
        } else {
          // STEP 3: Delete all rows if the current state is empty
          const deleteCategoryQuery = `DELETE FROM "Category"`;
          await client.query(deleteCategoryQuery);
        }

        await client.query('COMMIT');
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error registering category:', error.message);
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
