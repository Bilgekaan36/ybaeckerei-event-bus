import { EventType, StreamId } from 'lib/types/utility-types';
import { dbMigrationQueries } from '../../utils/databaseQueries';
import { State } from 'lib/types/event-sourcing/state';

type Constructor<T = any> = new (...args: any[]) => T;

export function helpingMethods<T extends Constructor>(
  base: T
): Constructor & T {
  return class extends base {
    constructor(...args: any[]) {
      super(...args);
    }

    // ----------- Event sourcing helping functions begins here ------------
    async createTables(): Promise<void> {
      const client = await this.pool.connect();

      try {
        dbMigrationQueries(client);
      } finally {
        client.release();
      }
    }

    async createOrUpdateSnapshot(
      streamId: StreamId,
      version: number,
      state: State
    ): Promise<void> {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Check if the record exists
        const result = await client.query(
          'SELECT 1 FROM "Snapshot" WHERE "streamId" = $1',
          [streamId]
        );

        if (result.rows.length > 0) {
          // If the record exists, perform an update
          await client.query(
            'UPDATE "Snapshot" SET version = $2, state = $3 WHERE "streamId" = $1',
            [streamId, version, state]
          );
          console.log('Snapshot updated.');
        } else {
          // If the record doesn't exist, perform an insert
          await client.query(
            'INSERT INTO "Snapshot" ("streamId", version, state) VALUES ($1, $2, $3)',
            [streamId, version, state]
          );
          console.log('Snapshot inserted.');
        }

        await client.query('COMMIT');
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error creating/updating snapshot:', error.message);
      } finally {
        client.release();
      }
    }

    async createOrUpdateStreamTable(
      eventType: EventType,
      items: any[]
    ): Promise<void> {
      const client = await this.pool.connect();
      try {
        switch (eventType) {
          case 'BillboardRegistered':
            for (const item of items) {
              const { billboardId, billboardTitle, billboardImageUrl } = item;
              // Check if a billboard with the given title already exists
              const existingBillboardResult = await client.query(
                'SELECT * FROM "Billboard" WHERE "billboardTitle" = $1',
                [billboardTitle]
              );
              if (existingBillboardResult.rows.length === 0) {
                await this.registerBillboard({
                  billboardId,
                  billboardTitle,
                  billboardImageUrl,
                });
              }
            }
            break;
          case 'CategoryRegistered':
            for (const item of items) {
              const { categoryName, billboardId } = item;
              const existingCategoryResult = await client.query(
                'SELECT * FROM "Category" WHERE "categoryName" = $1',
                [categoryName]
              );
              if (existingCategoryResult.rows.length === 0) {
                await this.registerCategory({ categoryName, billboardId });
              }
            }
            break;
        }
      } catch (error: any) {
        console.error('Error creating/updating stream table:', error.message);
      } finally {
        client.release();
      }
    }

    async getSnapshot(streamId: StreamId): Promise<any> {
      const client = await this.pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM "Snapshot" WHERE "streamId" = $1',
          [streamId]
        );

        if (result.rows.length > 0) {
          return result.rows[0].state;
        } else {
          return null;
        }
      } catch (error: any) {
        console.error('Error getting snapshot:', error.message);
      } finally {
        client.release();
      }
    }

    async getAllEvents(streamId: StreamId): Promise<any> {
      const client = await this.pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM "Event" WHERE "streamId" = $1 ORDER BY version',
          [streamId]
        );

        return result.rows;
      } catch (error: any) {
        console.error('Error getting all events:', error.message);
      } finally {
        client.release();
      }
    }

    // ----------- Event sourcing helping functions ends here ------------
  };
}
