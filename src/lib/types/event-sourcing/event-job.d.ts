import { EventType, StreamId } from '../utility-types';

export interface EventJob {
  data: {
    streamId: StreamId;
    data: {
      // Define the structure of the 'data' property
      // Adjust the types according to your actual data structure
      // For example, if 'data' is an object with specific properties, replace 'any' with the correct types
      [key: string]: any;
    };
    type: EventType;
  };
}
