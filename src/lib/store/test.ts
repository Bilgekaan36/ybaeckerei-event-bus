import { Pool } from 'pg';

export class PostgresqlDbStore {
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
    } finally {
      client.release();
    }
  }

  async storeEvent(
    streamId: number,
    version: number,
    data: any
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        'INSERT INTO events (stream_id, version, data) VALUES ($1, $2, $3)',
        [streamId, version, data]
      );
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

      const currentState = result.rows.reduce((state, row) => {
        const event = {
          version: row.version,
          data: row.data,
        };

        const handler = eventHandlers[row.data.eventType];
        if (handler) {
          state = handler(state, event);
        }

        return state;
      }, null);

      // Update or create a snapshot
      await this.createOrUpdateSnapshot(
        streamId,
        currentState.version,
        currentState
      );

      console.log(`Updated state for stream ${streamId}:`, currentState);
    } finally {
      client.release();
    }
  }
}
