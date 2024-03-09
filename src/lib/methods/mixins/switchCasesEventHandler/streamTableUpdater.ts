import { EventType, StreamId } from 'lib/types/utility-types';
import { State } from 'lib/types/event-sourcing/state';
import { PoolClient } from 'pg';

type Constructor<T = any> = new (...args: any[]) => T;

export function streamTableUpdaterMethod<T extends Constructor>(
  base: T
): Constructor & T {
  return class extends base {
    constructor(...args: any[]) {
      super(...args);
    }

    async handleStreamTableSwitchCase(
      streamId: StreamId,
      // eventType: EventType,
      items: any[],
      client: PoolClient
    ): Promise<void> {
      switch (streamId) {
        case 'Billboard':
          await this.registerBillboard(items);
          break;
        case 'Category':
          await this.registerCategory(items);
          break;
      }
    }
  };
}
