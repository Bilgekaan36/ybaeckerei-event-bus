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

type Constructor<T = any> = new (...args: any[]) => T;

export function editMethods<T extends Constructor>(base: T): Constructor & T {
  return class extends base {
    constructor(...args: any[]) {
      super(...args);
    }

    async editStore({ storeId, storeTitle, street, postalCode, city }: IStore) {
      const selectQuery = `
            SELECT "storeTitle"
            FROM "Store"
            WHERE "storeTitle" = $1
            AND "storeId" != $2;
            `;
      const updateQuery = `
            UPDATE "Store"
            SET "storeTitle" = $2, "street" = $3, "postalCode" = $4, city = $5
            WHERE "storeId" = $1;   
            `;

      const foundedStore = await this.pool.query(selectQuery, [
        storeTitle,
        storeId,
      ]);
      if (foundedStore.rows.length > 0) {
        throw new Error('Store with this name already exists.');
      } else {
        await this.pool.query(updateQuery, [
          storeId,
          storeTitle,
          street,
          postalCode,
          city,
        ]);
      }
    }

    async editBillboard({
      billboardId,
      billboardTitle,
      billboardImageUrl,
    }: IBillboard) {
      const selectQuery = `
          SELECT "billboardTitle"
          FROM "Billboard"
          WHERE "billboardTitle" = $1
          AND "billboardId" != $2;
          `;

      const updateQuery = `
          UPDATE "Billboard"
          SET "billboardTitle" = $2, "billboardImageUrl" = $3 
          WHERE "billboardId" = $1;
          `;

      const foundedBillboard = await this.pool.query(selectQuery, [
        billboardTitle,
        billboardId,
      ]);
      if (foundedBillboard.rows.length > 0) {
        throw new Error('Billboard with this name already exists.');
      } else {
        await this.pool.query(updateQuery, [
          billboardId,
          billboardTitle,
          billboardImageUrl,
        ]);
      }
    }

    async editCategory({ categoryId, categoryName, billboardId }: ICategory) {
      const selectQuery = `
          SELECT "categoryName"
          FROM "Category"
          WHERE "categoryName" = $1
          AND "categoryId" != $2;
          `;

      const updateQuery = `
          UPDATE "Category"
          SET "categoryName" = $2, "billboardId" = $3 
          WHERE "categoryId" = $1;
          `;

      const foundedCategory = await this.pool.query(selectQuery, [
        categoryName,
        categoryId,
      ]);
      if (foundedCategory.rows.length > 0) {
        throw new Error('Category with this name already exists.');
      } else {
        await this.pool.query(updateQuery, [
          categoryId,
          categoryName,
          billboardId,
        ]);
      }
    }

    async editCustomer({
      customerId,
      firstName,
      lastName,
      email,
      phoneNumber,
    }: ICustomer) {
      const selectQuery = `
            SELECT "email"
            FROM "Customer"
            WHERE "email" = $1
            AND "customerId" != $2;
            `;

      const updateQuery = `
            UPDATE "Customer"
            SET "firstName" = $2, "lastName" = $3, email = $4, "phoneNumber" = $5
            WHERE "customerId" = $1;
            `;

      const foundedCustomer = await this.pool.query(selectQuery, [
        email,
        customerId,
      ]);
      if (foundedCustomer.rows.length > 0) {
        throw new Error('Customer with this email already exists.');
      } else {
        await this.pool.query(updateQuery, [
          customerId,
          firstName,
          lastName,
          email,
          phoneNumber,
        ]);
      }
    }

    async editImage({ imageId, imageTitle, imageUrl }: IImage) {
      const selectQuery = `
            SELECT "imageTitle"
            FROM "Image"
            WHERE "imageTitle" = $1
            AND "imageId" != $2;
            `;

      const updateQuery = `
            UPDATE "Image"
            SET "imageTitle" = $2, "imageUrl" = $3
            WHERE "imageId" = $1;
            `;

      const foundedImage = await this.pool.query(selectQuery, [
        imageTitle,
        imageId,
      ]);
      if (foundedImage.rows.length > 0) {
        throw new Error('Image with this name already exists.');
      } else {
        await this.pool.query(updateQuery, [imageId, imageTitle, imageUrl]);
      }
    }

    async editProduct({
      productId,
      productName,
      productDescription,
      productPrice,
      stockQuantity,
      variantId,
      categoryId,
    }: IProduct) {
      const selectQuery = `
            SELECT "productName"
            FROM "Product"
            WHERE "productName" = $1
            AND "productId" != $2;
            `;

      const updateQuery = `
            UPDATE "Product"
            SET "productName" = $2, "productDescription" = $3, "productPrice" = $4, "stockQuantity" = $5, "variantId" = $6, "categoryId" = $7
            WHERE "productId" = $1;
            `;

      const foundedProduct = await this.pool.query(selectQuery, [
        productName,
        productId,
      ]);
      if (foundedProduct.rows.length > 0) {
        throw new Error('Product with this name already exists.');
      } else {
        await this.pool.query(updateQuery, [
          productId,
          productName,
          productDescription,
          productPrice,
          stockQuantity,
          variantId,
          categoryId,
        ]);
      }
    }

    async editSize({ sizeId, sizeValue, sizeType }: ISize) {
      const selectQuery = `
          SELECT "sizeType"
          FROM "Size"
          WHERE "sizeType" = $1
          AND "sizeId" != $2;
          `;

      const updateQuery = `
          UPDATE "Size"
          SET "sizeValue" = $2, "sizeType" = $3 
          WHERE "sizeId" = $1;
          `;

      const foundedSize = await this.pool.query(selectQuery, [
        sizeType,
        sizeId,
      ]);
      if (foundedSize.rows.length > 0) {
        throw new Error('Size with this type already exists.');
      } else {
        await this.pool.query(updateQuery, [sizeId, sizeValue, sizeType]);
      }
    }

    async editVariant({ variantId, variantTitle }: IVariant) {
      const selectQuery = `
          SELECT "variantTitle"
          FROM "Variant"
          WHERE "variantTitle" = $1
          AND "variantId" != $2;
          `;

      const updateQuery = `
          UPDATE "Variant"
          SET "variantTitle" = $2
          WHERE "variantId" = $1;
          `;

      const foundedVariant = await this.pool.query(selectQuery, [
        variantTitle,
        variantId,
      ]);
      if (foundedVariant.rows.length > 0) {
        throw new Error('Variant with this title already exists.');
      } else {
        await this.pool.query(updateQuery, [variantId, variantTitle]);
      }
    }
  };
}
