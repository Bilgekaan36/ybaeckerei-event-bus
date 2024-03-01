import { dbMigrationQueries } from '../../utils/databaseQueries';

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
      streamId: number,
      version: number,
      state: any
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
      eventType: string,
      items: any[]
    ): Promise<void> {
      const client = await this.pool.connect();
      try {
        switch (eventType) {
          case 'BillboardRegistered':
            for (const item of items) {
              const { billboardTitle, billboardImageUrl } = item;
              await this.registerBillboard({
                billboardTitle,
                billboardImageUrl,
              });
            }
            break;
          case 'CategoryRegistered':
            for (const item of items) {
              const { categoryName, billboardId } = item;
              await this.registerCategory({ categoryName, billboardId });
            }
            break;
        }
      } catch (error: any) {
        console.error('Error creating/updating stream table:', error.message);
      } finally {
        client.release();
      }
    }

    async getSnapshot(streamId: string): Promise<any> {
      const client = await this.pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM "Snapshot" WHERE "streamId" = $1',
          [streamId]
        );

        if (result.rows.length > 0) {
          return result.rows[0];
        } else {
          return null;
        }
      } catch (error: any) {
        console.error('Error getting snapshot:', error.message);
      } finally {
        client.release();
      }
    }

    async createOrUpdateStreamTableBySnapshot(
      snapshot: any,
      items: any[]
    ): Promise<void> {
      const client = await this.pool.connect();
      try {
        let streamId = snapshot.streamId;
        switch (streamId) {
          case 'Billboard':
            for (const item of items) {
              const { billboardTitle, billboardImageUrl } = item;
              await this.registerBillboard({
                billboardTitle,
                billboardImageUrl,
              });
            }
            break;
          case 'Category':
            for (const item of items) {
              const { categoryName, billboardId } = item;
              await this.registerCategory({ categoryName, billboardId });
            }
            break;
        }
      } catch (error: any) {
        console.error(
          'Error creating/updating stream table by snapshot state:',
          error.message
        );
      } finally {
        client.release();
      }
    }
    // ----------- Event sourcing helping functions ends here ------------
  };
}
