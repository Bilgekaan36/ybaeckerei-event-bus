import { Event } from 'lib/types/event-sourcing/event';
import { State } from 'lib/types/event-sourcing/state';

export const eventHandlers: Record<string, any> = {
  BillboardRegistered: (state: State, event: Event) => {
    state = state || { items: [], version: 0 };
    const billboard = {
      billboardId: event.data.billboardId,
      billboardTitle: event.data.billboardTitle,
      billboardImageUrl: event.data.billboardImageUrl,
    };
    // Check if the billboard with the same title is already included
    const isBillboardIncluded = state.items.some(
      (b: { billboardId: string }) => b.billboardId === billboard.billboardId
    );

    if (!isBillboardIncluded) {
      // If the billboard is not included, add it
      state.items = [...state.items, billboard];
    } else {
      // If the billboard is included, update it
      state.items = state.items.map((item: { billboardId: string }) =>
        item.billboardId === billboard.billboardId ? billboard : item
      );
    }
    state.version = event.version;
    return state;
  },
  BillboardRemoved: (state: State, event: Event) => {
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
  CategoryRegistered: (state: State, event: Event) => {
    state = state || { items: [], version: 0 };
    const category = {
      categoryName: event.data.categoryName,
      billboardId: event.data.billboardId,
    };
    // Check if the category with the same title is already included
    const isCategoryIncluded = state.items.some(
      (b: { categoryName: string }) => b.categoryName === category.categoryName
    );

    if (!isCategoryIncluded) {
      // If the category is not included, add it
      state.items = [...state.items, category];
    } else {
      state.items = state.items.map((item: { categoryName: string }) =>
        item.categoryName === category.categoryName ? category : item
      );
    }
    state.version = event.version;
    return state;
  },
};
