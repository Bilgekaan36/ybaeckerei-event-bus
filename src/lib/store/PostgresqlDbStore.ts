import { Pool, QueryResult } from 'pg';
import { registrationMethods } from '../methods/mixins/registrationMethods';
import { editMethods } from '../methods/mixins/editMethods';
import { removeMethods } from '../methods/mixins/removeMethods';
import { dbMigrationQueries } from '../utils/databaseQueries';

// Custom error class for event storing failures
class EventStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventStoreError';
  }
}

const mixinMethods = registrationMethods(editMethods(removeMethods(class {})));

export class PostgresqlDbStore extends mixinMethods {
  private pool: Pool;
  constructor({ host, port, user, password, database }: any) {
    const config = {
      user,
      host,
      database,
      password,
      port,
    };
    const pool = new Pool(config);
    super();
    this.pool = pool;
  }

  async initialize() {
    await this.createTables();
  }

  async createTables(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          id SERIAL PRIMARY KEY,
          stream_id BIGINT NOT NULL,
          version BIGINT NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (stream_id, version)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS snapshots (
          aggregate_id BIGINT PRIMARY KEY,
          version BIGINT,
          state JSONB
        )
      `);
      dbMigrationQueries(client);
    } finally {
      client.release();
    }
  }

  async storeEvent(streamId: number, data: any): Promise<void> {
    const client = await this.pool.connect();

    try {
      const result: QueryResult = await client.query(
        'SELECT MAX(version) as max_version FROM events WHERE stream_id = $1',
        [streamId]
      );

      const maxVersion = result.rows[0].max_version || 0;

      await client.query(
        'INSERT INTO events (stream_id, version, data) VALUES ($1, $2, $3)',
        [streamId, Number(maxVersion) + 1, data]
      );
    } catch (error) {
      // Handle/store the error as needed
      //@ts-ignore
      console.error('Error storing event:', error.message);
    } finally {
      client.release();
    }
  }

  async applyEventsAndUpdateState(
    streamId: number,
    eventHandlers: Record<string, any>
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM events WHERE stream_id = $1 ORDER BY version',
        [streamId]
      );

      let currentState = null;

      for (const row of result.rows) {
        const event = {
          version: row.version,
          data: row.data,
        };

        const handler = eventHandlers[row.data.type];
        if (handler) {
          currentState = handler(currentState, event);
        } else {
          console.error(`No handler found for type: ${row.data.type}`);
        }

        if (currentState !== null && currentState.version % 10 === 0) {
          // Create or update a snapshot every 100 versions
          await this.createOrUpdateSnapshot(
            streamId,
            currentState.version,
            currentState
          );
          console.log(
            `Created snapshot for stream ${streamId} at version ${currentState.version}`
          );
        } else if (currentState !== null) {
          // Create or synchronize a table for each streamId
          await this.createOrUpdateStreamTable(
            row.data.type,
            currentState.items
          );
        } else {
          console.log(`Current state is null for stream ${streamId}`);
        }
      }
    } finally {
      client.release();
    }
  }

  async createOrUpdateSnapshot(
    aggregateId: number,
    version: number,
    state: any
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        'INSERT INTO snapshots (aggregate_id, version, state) VALUES ($1, $2, $3) ON CONFLICT (aggregate_id) DO UPDATE SET version = EXCLUDED.version, state = EXCLUDED.state',
        [aggregateId, version, state]
      );
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
            this.registerBillboard({ billboardTitle, billboardImageUrl });
          }
          break;
      }
    } catch (error) {
      //@ts-ignore
      console.error('Error creating/updating stream table:', error.message);
    } finally {
      client.release();
    }
  }
}
