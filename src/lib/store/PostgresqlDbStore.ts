import { Pool, QueryResult } from 'pg';
import { registrationMethods } from '../methods/mixins/registrationMethods';
import { editMethods } from '../methods/mixins/editMethods';
import { removeMethods } from '../methods/mixins/removeMethods';
import { helpingMethods } from '../methods/mixins/helpingMethods';
import { eventHandlers } from '../utils/eventHandlers';
import { State } from 'lib/types/event-sourcing/state';
import { Event } from 'lib/types/event-sourcing/event';
import { StreamId } from 'lib/types/utility-types';
import { v4 as uuidv4 } from 'uuid';

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

      switch (streamId) {
        case 'Billboard':
          const billboardTitle = data.billboardTitle;

          // Check if there is an event with the same streamId, billboardTitle, and the max version
          const existingBillboardIdResult = await client.query(
            'SELECT DISTINCT data->>\'billboardId\' as existing_billboard_id FROM "Event" WHERE "streamId" = $1 AND data->>\'billboardTitle\' = $2',
            [streamId, billboardTitle]
          );

          const existingBillboardId =
            existingBillboardIdResult.rows[0]?.existing_billboard_id;
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
          // Insert the event for other streams
          await client.query(
            'INSERT INTO "Event" ("streamId", version, data) VALUES ($1, $2, $3)',
            [streamId, Number(maxVersion) + 1, data]
          );
          break;
        // Add more cases for other streams if needed
      }

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
          currentState = handler(currentState, event);
        } else {
          console.error(`No handler found for type: ${row.data.type}`);
        }
        const existingSnapshotMaxVersionResult = await client.query(
          'SELECT MAX(version) as max_version FROM "Snapshot" WHERE "streamId" = $1',
          [streamId]
        );
        const existingSnapshotMaxVersion =
          existingSnapshotMaxVersionResult.rows[0].max_version || 0;

        if (
          currentState !== null &&
          currentState.version % 10 === 0 &&
          Number(currentState.version) > Number(existingSnapshotMaxVersion)
        ) {
          await this.createOrUpdateSnapshot(
            streamId,
            currentState.version,
            currentState
          );
          snapshotVersion = currentState.version; // Update snapshotVersion to the new version
        }

        if (
          currentState !== null &&
          row.version >= snapshotVersion &&
          row.version >= currentState.version
        ) {
          // Only call createOrUpdateStreamTable for non-snapshot events and versions that haven't been processed
          await this.createOrUpdateStreamTable(
            row.data.type,
            currentState?.items
          );
        } else {
          console.log(
            `Current state is null or version already processed for stream ${streamId}`
          );
        }
      }
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
