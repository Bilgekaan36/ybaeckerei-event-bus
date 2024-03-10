import { StreamId } from 'lib/types/utility-types';
import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

type Constructor<T = any> = new (...args: any[]) => T;

export function streamEventHandlerMethod<T extends Constructor>(
  base: T
): Constructor & T {
  return class extends base {
    constructor(...args: any[]) {
      super(...args);
    }

    async streamEventHandler(
      client: PoolClient,
      streamId: StreamId,
      data: any,
      maxVersion: number
    ): Promise<void> {
      switch (streamId) {
        case 'Billboard':
          let existingBillboardIdResult = null;

          if (data.billboardTitle) {
            // Check if there is an event with the same streamId, billboardTitle, and the max version
            existingBillboardIdResult = await client.query(
              'SELECT DISTINCT data->>\'billboardId\' as existing_billboard_id FROM "Event" WHERE "streamId" = $1 AND data->>\'billboardTitle\' = $2',
              [streamId, data.billboardTitle]
            );
          } else if (data.billboardId) {
            // Check if there is an event with the same streamId, billboardId, and the max version
            existingBillboardIdResult = await client.query(
              'SELECT DISTINCT data->>\'billboardId\' as existing_billboard_id FROM "Event" WHERE "streamId" = $1 AND data->>\'billboardId\' = $2',
              [streamId, data.billboardId]
            );
          }

          const existingBillboardId =
            existingBillboardIdResult?.rows[0]?.existing_billboard_id;
          // Use the existing billboardId or generate a new one
          const newBillboardId = existingBillboardId
            ? existingBillboardId
            : uuidv4();

          // Set the "billboardId" in the data
          data.billboardId = newBillboardId;

          // Insert the event
          await client.query(
            'INSERT INTO "Event" ("streamId", version, data) VALUES ($1, $2, $3)',
            [streamId, Number(maxVersion) + 1, data]
          );
          break;
        case 'Category':
          let existingCategoryIdResult = null;

          if (data.categoryName) {
            const categoryName = data.categoryName;
            // Check if there is an event with the same streamId, categoryName, and the max version
            existingCategoryIdResult = await client.query(
              'SELECT DISTINCT data->>\'categoryId\' as existing_category_id FROM "Event" WHERE "streamId" = $1 AND data->>\'categoryName\' = $2',
              [streamId, categoryName]
            );
          } else if (data.categoryId) {
            const categoryId = data.categoryId;
            // Check if there is an event with the same streamId, categoryId, and the max version
            existingCategoryIdResult = await client.query(
              'SELECT DISTINCT data->>\'categoryId\' as existing_category_id FROM "Event" WHERE "streamId" = $1 AND data->>\'categoryId\' = $2',
              [streamId, categoryId]
            );
          }
          const existingCategoryId =
            existingCategoryIdResult?.rows[0]?.existing_category_id;
          // Use the existing billboardId or generate a new one
          const newCategoryId = existingCategoryId
            ? existingCategoryId
            : uuidv4();

          // Set the "categoryId" in the data
          data.categoryId = newCategoryId;

          // Insert the event
          await client.query(
            'INSERT INTO "Event" ("streamId", version, data) VALUES ($1, $2, $3)',
            [streamId, Number(maxVersion) + 1, data]
          );
          break;
        case 'Size':
          let existingSizeIdResult = null;

          if (data.sizeValue && data.sizeType) {
            const sizeValue = data.sizeValue;
            const sizeType = data.sizeType;

            // Check if there is an event with the same streamId, sizeValue, sizeType, and the max version
            existingSizeIdResult = await client.query(
              "SELECT DISTINCT data->>'sizeId' as existing_size_id FROM \"Event\" WHERE \"streamId\" = $1 AND data->>'sizeValue' = $2 AND data->>'sizeType' = $3",
              [streamId, sizeValue, sizeType]
            );
          } else if (data.sizeId) {
            const sizeId = data.sizeId;
            // Check if there is an event with the same streamId, sizeId, and the max version
            existingSizeIdResult = await client.query(
              'SELECT DISTINCT data->>\'sizeId\' as existing_size_id FROM "Event" WHERE "streamId" = $1 AND data->>\'sizeId\' = $2',
              [streamId, sizeId]
            );
          }

          const existingSizeId =
            existingSizeIdResult?.rows[0]?.existing_size_id;

          // Use the existing sizeId or generate a new one
          const newSizeId = existingSizeId ? existingSizeId : uuidv4();

          // Set the "sizeId" in the data
          data.sizeId = newSizeId;

          // Insert the event
          await client.query(
            'INSERT INTO "Event" ("streamId", version, data) VALUES ($1, $2, $3)',
            [streamId, Number(maxVersion) + 1, data]
          );
          break;
      }
    }
  };
}
