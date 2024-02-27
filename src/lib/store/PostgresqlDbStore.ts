import { Pool, QueryResult } from 'pg';
import { registrationMethods } from '../methods/mixins/registrationMethods';
import { editMethods } from '../methods/mixins/editMethods';
import { removeMethods } from '../methods/mixins/removeMethods';
import { helpingMethods } from '../methods/mixins/helpingMethods';
import { eventHandlers } from '../utils/eventHandlers';

const mixinMethods = helpingMethods(
  registrationMethods(editMethods(removeMethods(class {})))
);

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

  // ----------- Event sourcing methods begins here ------------
  async storeEvent(streamId: number, data: any): Promise<void> {
    const client = await this.pool.connect();

    try {
      const result: QueryResult = await client.query(
        'SELECT MAX(version) as max_version FROM "Event" WHERE "streamId" = $1',
        [streamId]
      );

      const maxVersion = result.rows[0].max_version || 0;

      await client.query(
        'INSERT INTO "Event" ("streamId", version, data) VALUES ($1, $2, $3)',
        [streamId, Number(maxVersion) + 1, data]
      );
    } catch (error: any) {
      // Handle/store the error as needed
      console.error('Error storing event:', error.message);
    } finally {
      client.release();
      this.applyEventsAndUpdateState(streamId, eventHandlers);
    }
  }

  async applyEventsAndUpdateState(
    streamId: number,
    eventHandlers: Record<string, any>
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM "Event" WHERE "streamId" = $1 ORDER BY version',
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
  // ----------- Event sourcing methods ends here ------------
}
