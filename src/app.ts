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

(async () => {
  const logger = flaschenpost.getLogger();

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
  // Reuse the ioredis instance
  const eventQueue = new Queue('eventqueue', {
    connection: redisConnection,
  });

  const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [new BullAdapter(eventQueue)],
    serverAdapter: serverAdapter,
  });

  const api = express();

  const workerInstance = new Worker(
    'eventqueue',
    async (job) => {
      // console.log('job.id', job.id);
      // console.log('job', job);
      console.log('job.name', job.name);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      job.updateProgress(100);
      return 'some value';
    },
    { connection: redisConnection }
  );

  workerInstance.on('active', (job) => {
    console.log(`[${job.id}] has started!`);
  });

  workerInstance.on('completed', async (job) => {
    // set apply events into postgresql database
    console.log(`[${job.id}] has completed!`);
  });

  workerInstance.on('failed', async (job, err) => {
    console.error(`[${job?.id}] has failed with ${err.message}`);
    console.error(err);
  });

  workerInstance.on('error', (err) => {
    console.error(`WorkerInstance has errored with ${err.message}`);
  });

  api.use(cors());
  api.use(bodyParser.json());
  api.use('/admin/queues', serverAdapter.getRouter());

  const server = http.createServer(api);

  server.listen(PORT, () => {
    logger.info('Server started.', { PORT });
  });
})();
