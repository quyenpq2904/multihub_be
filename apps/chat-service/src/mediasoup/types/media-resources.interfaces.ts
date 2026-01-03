import { Router, Worker } from 'mediasoup/node/lib/types';

export interface IWorker {
  worker: Worker;
  routers: Map<string, Router>;
}
