import { Event } from 'lib/types/event-sourcing/event';
import { State } from 'lib/types/event-sourcing/state';
import { EventType } from 'lib/types/utility-types';

export const eventHandlers: Record<EventType, any> = {
  BillboardRegistered: async (client: any, state: State, event: Event) => {
    state = state || { items: [], version: 0 };
    const billboard = {
      billboardId: event.data.billboardId,
      billboardTitle: event.data.billboardTitle,
      billboardImageUrl: event.data.billboardImageUrl,
    };
    // Check if the billboard with the same title is already included
    const isBillboardIncluded = state.items.some(
      (b: { billboardId: string }) => b.billboardId === billboard.billboardId
    );

    if (!isBillboardIncluded) {
      // If the billboard is not included, add it
      state.items = [...state.items, billboard];
    } else {
      // If the billboard is included, update it
      state.items = state.items.map((item: { billboardId: string }) =>
        item.billboardId === billboard.billboardId ? billboard : item
      );
    }
    state.version = event.version;
    return state;
  },
  BillboardRemoved: async (client: any, state: State, event: Event) => {
    state = state || { items: [], version: 0 };

    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const billboardIdToRemove = event.data.billboardId;

      // Check if any category references the billboard to be removed
      const isBillboardReferencedQuery = `
        SELECT COUNT(*) AS count
        FROM "Category"
        WHERE "billboardId" = $1
    `;

      const result = await client.query(isBillboardReferencedQuery, [
        billboardIdToRemove,
      ]);
      const isBillboardReferenced = result.rows[0].count > 0;

      if (isBillboardReferenced) {
        console.error(
          `Cannot remove billboard ${billboardIdToRemove} as it is referenced by a category.`
        );
        // You may choose to handle this situation differently, such as throwing an error.
        // For now, the removal is prevented.
      } else {
        // Find the index using a loop and manual comparison
        const indexToRemove = state.items.findIndex((billboard) => {
          return billboard.billboardId === billboardIdToRemove;
        });

        if (indexToRemove !== -1) {
          // If working with immutable state, create a new array without the removed item
          state.items = [
            ...state.items.slice(0, indexToRemove),
            ...state.items.slice(indexToRemove + 1),
          ];
          console.log(`Billboard ${billboardIdToRemove} removed.`);
        }

        state.version = event.version;
      }
      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error handling BillboardRemoved event:', error.message);
    }
    return state;
  },
  CategoryRegistered: async (client: any, state: State, event: Event) => {
    state = state || { items: [], version: 0 };

    const category = {
      categoryId: event.data.categoryId,
      categoryName: event.data.categoryName,
      billboardId: event.data.billboardId,
    };
    // Check if the category with the same title is already included
    const isCategoryIncluded = state.items.some(
      (b: { categoryName: string }) => b.categoryName === category.categoryName
    );

    if (!isCategoryIncluded) {
      // If the category is not included, add it
      state.items = [...state.items, category];
    } else {
      state.items = state.items.map((item: { categoryName: string }) =>
        item.categoryName === category.categoryName ? category : item
      );
    }
    state.version = event.version;
    return state;
  },
  CategoryRemoved: async (client: any, state: State, event: Event) => {
    state = state || { items: [], version: 0 };

    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const categoryIdToRemove = event.data.categoryId;

      // Check if any product references the category to be removed
      const isCategoryReferencedQuery = `
          SELECT COUNT(*) AS count
          FROM "Product"
          WHERE "categoryId" = $1
      `;

      const result = await client.query(isCategoryReferencedQuery, [
        categoryIdToRemove,
      ]);
      const isCategoryReferenced = result.rows[0].count > 0;

      if (isCategoryReferenced) {
        console.error(
          `Cannot remove category ${isCategoryReferenced} as it is referenced by a product.`
        );
        // You may choose to handle this situation differently, such as throwing an error.
        // For now, the removal is prevented.
      } else {
        const indexToRemove = state.items.findIndex(
          (item) => item.categoryId === categoryIdToRemove
        );

        if (indexToRemove !== -1) {
          // If working with immutable state, create a new array without the removed item
          state.items = [
            ...state.items.slice(0, indexToRemove),
            ...state.items.slice(indexToRemove + 1),
          ];
          console.log(`Category ${categoryIdToRemove} removed.`);
        }
        state.version = event.version;
      }
      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error handling CategoryRemoved event:', error.message);
    }
    return state;
  },
  SizeRegistered: async (client: any, state: State, event: Event) => {
    state = state || { items: [], version: 0 };

    const size = {
      sizeId: event.data.sizeId,
      sizeType: event.data.sizeType,
      sizeValue: event.data.sizeValue,
    };
    // Check if the size with the same id, type, and value is already included
    const isSizeIncluded = state.items.some(
      (item: { sizeId: string; sizeType: string; sizeValue: number }) =>
        item.sizeId === size.sizeId ||
        (item.sizeType === size.sizeType && item.sizeValue === size.sizeValue)
    );

    if (!isSizeIncluded) {
      // If the size is not included, add it
      state.items = [...state.items, size];
    } else {
      // If the size is included, update it
      state.items = state.items.map(
        (item: { sizeId: string; sizeType: string; sizeValue: number }) =>
          item.sizeId === size.sizeId ||
          (item.sizeType === size.sizeType && item.sizeValue === size.sizeValue)
            ? size
            : item
      );
    }

    // Merge multiple items with the same sizeId (if any)
    const uniqueItems = state.items.reduce((acc: any[], currentItem: any) => {
      const existingItem = acc.find(
        (item) => item.sizeId === currentItem.sizeId
      );
      if (existingItem) {
        existingItem.sizeValue = currentItem.sizeValue;
      } else {
        acc.push({ ...currentItem });
      }
      return acc;
    }, []);

    state.items = uniqueItems;

    state.version = event.version;
    return state;
  },
  SizeRemoved: async (client: any, state: State, event: Event) => {
    state = state || { items: [], version: 0 };

    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const sizeIdToRemove = event.data.sizeId;

      // Check if any ProductSize references the Size to be removed
      const isSizesReferencedQuery = `
          SELECT COUNT(*) AS count
          FROM "ProductSize"
          WHERE "sizeId" = $1
      `;

      const result = await client.query(isSizesReferencedQuery, [
        sizeIdToRemove,
      ]);
      const isCategoryReferenced = result.rows[0].count > 0;

      if (isCategoryReferenced) {
        console.error(
          `Cannot remove category ${isCategoryReferenced} as it is referenced by a product.`
        );
        // You may choose to handle this situation differently, such as throwing an error.
        // For now, the removal is prevented.
      } else {
        const indexToRemove = state.items.findIndex(
          (item) => item.sizeId === sizeIdToRemove
        );

        if (indexToRemove !== -1) {
          // If working with immutable state, create a new array without the removed item
          state.items = [
            ...state.items.slice(0, indexToRemove),
            ...state.items.slice(indexToRemove + 1),
          ];
          console.log(`Size ${sizeIdToRemove} removed.`);
        }
        state.version = event.version;
      }
      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error handling SizeRemoved event:', error.message);
    }
    return state;
  },
  CustomerRegistered: undefined,
  CustomerRemoved: undefined,
  ImageRegistered: undefined,
  ImageRemoved: undefined,
  ProductRegistered: undefined,
  ProductRemoved: undefined,
  StoreRegistered: undefined,
  StoreRemoved: undefined,
  VariantRegistered: undefined,
  VariantRemoved: undefined,
};
