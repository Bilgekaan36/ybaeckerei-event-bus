import { Pool, QueryResult } from 'pg';
import { registrationMethods } from '../methods/mixins/registrationMethods';
import { editMethods } from '../methods/mixins/editMethods';
import { removeMethods } from '../methods/mixins/removeMethods';
import { helpingMethods } from '../methods/mixins/helpingMethods';
import { eventHandlers } from '../utils/eventHandlers';
import { State } from 'lib/types/state';

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
  async storeEvent(streamId: string, data: any): Promise<void> {
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
    streamId: string,
    eventHandlers: Record<string, any>
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      let currentState: State = { items: [], version: 0 };

      // Check for existing snapshot for the given streamId
      const snapshotResult = await client.query(
        'SELECT * FROM "Snapshot" WHERE "streamId" = $1',
        [streamId]
      );

      if (snapshotResult.rows.length > 0) {
        // If snapshot exists, use the snapshot's state as the current state
        currentState = snapshotResult.rows[0].state;
      }

      // Determine the snapshot version (if snapshot exists)
      const snapshotVersion = currentState ? currentState.version : 0;
      // Query events for the given streamId starting from the version after the snapshot
      const result = await client.query(
        'SELECT * FROM "Event" WHERE "streamId" = $1 AND version > $2 ORDER BY version',
        [streamId, snapshotVersion]
      );

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
          // Create or update a snapshot every 10 versions
          await this.createOrUpdateSnapshot(
            streamId,
            currentState.version,
            currentState
          );
          console.log(
            `Created snapshot for stream ${streamId} at version ${currentState.version}`
          );
        } else if (row.version > snapshotVersion) {
          // Only call createOrUpdateStreamTable for non-snapshot events
          await this.createOrUpdateStreamTable(
            row.data.type,
            currentState.items
          );
        } else {
          console.log(`Current state is null for stream ${streamId}`);
        }
      }
    } catch (error: any) {
      console.error('Error applying events and updating state:', error.message);
    } finally {
      client.release();
    }
  }

  // ----------- Event sourcing methods ends here ------------
}
