import {
  IConsumer,
  IProducer,
  IRouter,
  ITransport,
} from './media-resources.type';

export interface Peer {
  id: string;
  transports: Map<string, ITransport>;
  producers: Map<string, IProducer>;
  consumers: Map<string, IConsumer>;
}

export interface IRoom {
  id: string;
  router: IRouter;
  peers: Map<string, Peer>;
}
