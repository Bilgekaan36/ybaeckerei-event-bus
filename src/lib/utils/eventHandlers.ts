import { Event } from 'lib/types/event';

export const eventHandlers: Record<string, any> = {
  BillboardRegistered: (state: any, event: Event) => {
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
    } else {
      console.error(
        `Billboard with title '${billboard.billboardTitle}' already included.`
      );
    }
    state.version = event.version;
    return state;
  },
  BillboardRemoved: (state: any, event: Event) => {
    state = state || { items: [], version: 0 };
    if (event.version !== state.version) {
      const indexToRemove = state.items.lastIndexOf(event.data.eventData);

      if (indexToRemove !== -1) {
        state.items.splice(indexToRemove, 1);
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
    state.version = event.version;
    return state;
  },
};
