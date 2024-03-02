import { StreamId } from '../utility-types';

export interface Event {
  id?: number;
  streamId?: StreamId;
  version: number;
  data: any;
}
