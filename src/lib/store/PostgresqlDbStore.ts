import { Pool, QueryResult } from 'pg';
import { registrationMethods } from '../methods/mixins/registrationMethods';
import { editMethods } from '../methods/mixins/editMethods';
import { removeMethods } from '../methods/mixins/removeMethods';
import { helpingMethods } from '../methods/mixins/helpingMethods';
import { streamTableUpdaterMethod } from '../methods/mixins/switchCasesEventHandler/streamTableUpdater';
import { streamEventHandlerMethod } from '../methods/mixins/switchCasesEventHandler/streamEventHandler';
import { eventHandlers } from '../utils/eventHandlers';
import { State } from 'lib/types/event-sourcing/state';
import { Event } from 'lib/types/event-sourcing/event';
import { StreamId } from 'lib/types/utility-types';

const mixinMethods = helpingMethods(
  registrationMethods(
    editMethods(
      removeMethods(
        streamTableUpdaterMethod(streamEventHandlerMethod(class {}))
      )
    )
  )
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

  // ----------- Event sourcing main methods begins here ------------

  async storeEvent(streamId: StreamId, data: any): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const result: QueryResult = await client.query(
        'SELECT MAX(version) as max_version FROM "Event" WHERE "streamId" = $1',
        [streamId]
      );

      const maxVersion = result.rows[0].max_version || 0;

      // Handle the event based on streamId
      await this.streamEventHandler(client, streamId, data, maxVersion);

      await client.query('COMMIT');
    } catch (error: any) {
      // Handle/store the error as needed
      await client.query('ROLLBACK');
      console.error('Error storing event:', error.message);
    } finally {
      client.release();
      this.applyEventsAndUpdateState(streamId, eventHandlers);
    }
  }

  async applyEventsAndUpdateState(
    streamId: StreamId,
    eventHandlers: Record<string, any>
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
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
      let snapshotVersion = currentState ? currentState.version : 0;

      // Query events for the given streamId starting from the version after the snapshot
      const result = await client.query(
        'SELECT * FROM "Event" WHERE "streamId" = $1 AND version >= $2 ORDER BY version',
        [streamId, snapshotVersion]
      );

      for (const row of result.rows) {
        const event: Event = {
          version: row.version,
          data: row.data,
        };

        const handler = eventHandlers[row.data.type];
        if (handler) {
          const updatedState = await handler(client, currentState, event);
          currentState = { ...currentState, ...updatedState };
        } else {
          console.error(`No handler found for type: ${row.data.type}`);
        }

        if (
          currentState !== null &&
          currentState.version % 10 === 0 &&
          Number(currentState.version) > Number(snapshotVersion)
        ) {
          await this.createOrUpdateSnapshot(
            streamId,
            currentState.version,
            currentState
          );
          snapshotVersion = currentState.version; // Update snapshotVersion to the new version
        }
      }
      // TODO: Update createOrUpdateStreamTable  and get also data from snapshot table when events starting from the snapshot
      console.log(
        'currentState.version',
        currentState.version,
        snapshotVersion
      );
      await this.createOrUpdateStreamTable(streamId, currentState.items);
      await client.query('COMMIT'); // Commit the transaction
    } catch (error: any) {
      // Handle/store the error as needed
      await client.query('ROLLBACK');
      console.error('Error applying events and updating state:', error.message);
    } finally {
      client.release();
    }
  }
  // ----------- Event sourcing main methods ends here ------------
}
