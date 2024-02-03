import http from 'http';
import { flaschenpost } from 'flaschenpost';
import { PORT } from './configs';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { Queue, Worker } from 'bullmq';
import { redisConnection } from './redis-connection';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { PostgresqlDbStore } from './lib/store/PostgresqlDbStore';

const serverAdapter = new ExpressAdapter();
// Reuse the ioredis instance
const eventQueue = new Queue('eventqueue', {
  connection: redisConnection,
});

const store = new PostgresqlDbStore({
  user: 'postgres',
  host: 'localhost',
  database: 'eventsourcingdb',
  password: 'secret',
  port: 5432,
});

(async () => {
  const logger = flaschenpost.getLogger();

  await store.initialize();

  serverAdapter.setBasePath('/admin/queues');

  const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [new BullAdapter(eventQueue)],
    serverAdapter: serverAdapter,
  });

  const eventHandlers: Record<string, any> = {
    BillboardRegistered: (state: any, event: any) => {
      state = state || { items: [], version: 0 };
      const billboard = {
        billboardTitle: event.data.billboardTitle,
        billboardImageUrl: event.data.billboardImageUrl,
      };
      // Check if the billboard with the same title is already included
      const isBillboardIncluded = state.items.some(
        (b: { billboardTitle: string }) =>
          b.billboardTitle === billboard.billboardTitle
      );

      if (!isBillboardIncluded) {
        // If the billboard is not included, add it
        state.items = [...state.items, billboard];
        state.version = event.version;
      } else {
        console.error(
          `Billboard with title '${billboard.billboardTitle}' already included.`
        );
      }
      return state;
    },
    BillboardRemoved: (state: any, event: any) => {
      state = state || { items: [], version: 0 };
      if (event.version !== state.version) {
        const indexToRemove = state.items.lastIndexOf(event.data.eventData);

        if (indexToRemove !== -1) {
          state.items.splice(indexToRemove, 1);
          state.version = event.version;
        } else {
          console.error(`Item not found in the items array.`);
          // store.storeEvent(streamId, {
          //   eventType: 'RemoveItemFailed',
          //   item_name: 'ProductC',
          // });
        }
      } else {
        console.error(`Concurrent event detected for stream ${event.streamId}`);
      }
      return state;
    },
  };

  const api = express();

  const handleJobs = async (job: any) => {
    const { streamId, data, type } = job.data;
    console.log(`Processing event: ${type}`);
    // Your processing logic here
    const applyEvent = async () => {
      await store.storeEvent(streamId, { type, ...data }),
        await store.applyEventsAndUpdateState(streamId, eventHandlers);
    };
    applyEvent();
  };

  // Worker instance for incoming events from eventqueue
  const workerInstance = new Worker('eventqueue', handleJobs, {
    connection: redisConnection,
  });

  // Handle the 'completed' event for itemAddedWorker
  workerInstance.on('completed', async (job) => {
    console.log(`Event processing completed for: ${job.data.type}`);
    // Additional actions after job completion
  });

  api.use(cors());
  api.use(bodyParser.json());
  api.use('/admin/queues', serverAdapter.getRouter());

  const server = http.createServer(api);

  server.listen(PORT, () => {
    logger.info('Server started.', { PORT });
  });
})();
