type Constructor<T = any> = new (...args: any[]) => T;

export function removeMethods<T extends Constructor>(base: T): Constructor & T {
  return class extends base {
    constructor(...args: any[]) {
      super(...args);
    }

    async removeStore({ storeId }: { storeId: string }) {
      const selectQuery = `
            SELECT "storeId"
            FROM "Store"
            WHERE "storeId" = $1;
            `;
      const removeQuery = `
            DELETE FROM "Store"
            WHERE "storeId" = $1;
            `;

      const foundedStore = await this.pool.query(selectQuery, [storeId]);
      if (foundedStore.rows.length > 0) {
        await this.pool.query(removeQuery, [storeId]);
      } else {
        throw new Error('Store not exists.');
      }
    }

    async removeBillboard({ billboardId }: { billboardId: string }) {
      const removeQuery = `
              DELETE FROM "Billboard"
              WHERE "billboardId" = $1;
              `;

      await this.pool.query(removeQuery, [billboardId]);
    }

    async removeCategory({ categoryId }: { categoryId: string }) {
      const client = await this.pool.connect();
      // try {
      //   await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      //   const removeQuery = `
      //           DELETE FROM "Category"
      //           WHERE "categoryId" = $1;
      //           `;

      //   await this.pool.query(removeQuery, [categoryId]);
      //   console.log('Category removed.');
      //   await client.query('COMMIT');
      // } catch (error: any) {
      //   await client.query('ROLLBACK');
      //   console.error('Error remove category:', error.message);
      // } finally {
      //   client.release();
      // }
    }

    async removeCustomer({ customerId }: { customerId: string }) {
      const selectQuery = `
                  SELECT "customerId"
                  FROM "Customer"
                  WHERE "customerId" = $1;
                  `;
      const removeQuery = `
                  DELETE FROM "Customer"
                  WHERE "customerId" = $1;
                  `;

      const foundedCustomer = await this.pool.query(selectQuery, [customerId]);
      if (foundedCustomer.rows.length > 0) {
        await this.pool.query(removeQuery, [customerId]);
      } else {
        throw new Error('Customer not exists.');
      }
    }

    async removeImage({ imageId }: { imageId: string }) {
      const selectQuery = `
                    SELECT "imageId"
                    FROM "Image"
                    WHERE "imageId" = $1;
                    `;
      const removeQuery = `
                    DELETE FROM "Image"
                    WHERE "imageId" = $1;
                    `;

      const foundedImage = await this.pool.query(selectQuery, [imageId]);
      if (foundedImage.rows.length > 0) {
        await this.pool.query(removeQuery, [imageId]);
      } else {
        throw new Error('Image not exists.');
      }
    }

    async removeProduct({ productId }: { productId: string }) {
      const selectQuery = `
                      SELECT "productId"
                      FROM "Product"
                      WHERE "productId" = $1;
                      `;
      const removeQuery = `
                      DELETE FROM "Product"
                      WHERE "productId" = $1;
                      `;

      const foundedProduct = await this.pool.query(selectQuery, [productId]);
      if (foundedProduct.rows.length > 0) {
        await this.pool.query(removeQuery, [productId]);
      } else {
        throw new Error('Product not exists.');
      }
    }

    async removeSize({ sizeId }: { sizeId: string }) {
      const selectQuery = `
                        SELECT "sizeId"
                        FROM "Size"
                        WHERE "sizeId" = $1;
                        `;
      const removeQuery = `
                        DELETE FROM "Size"
                        WHERE "sizeId" = $1;
                        `;

      const foundedSize = await this.pool.query(selectQuery, [sizeId]);
      if (foundedSize.rows.length > 0) {
        await this.pool.query(removeQuery, [sizeId]);
      } else {
        throw new Error('Size not exists.');
      }
    }

    async removeVariant({ variantId }: { variantId: string }) {
      const selectQuery = `
                          SELECT "variantId"
                          FROM "Variant"
                          WHERE "variantId" = $1;
                          `;
      const removeQuery = `
                          DELETE FROM "Variant"
                          WHERE "variantId" = $1;
                          `;

      const foundedVariant = await this.pool.query(selectQuery, [variantId]);
      if (foundedVariant.rows.length > 0) {
        await this.pool.query(removeQuery, [variantId]);
      } else {
        throw new Error('Variant not exists.');
      }
    }
  };
}
