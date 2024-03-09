# Event Sourcing with PostgreSQL - README

## Introduction

This codebase demonstrates an event sourcing approach using PostgreSQL as a data store. The `PostgresqlDbStore` class provides methods for storing events, applying them, and updating the state based on event handlers.

## Getting Started

1. **Installation:** Ensure PostgreSQL is installed and the necessary Node.js dependencies are installed using `npm install`.

2. **Configuration:** Set up your PostgreSQL connection details in the `constructor` of the `PostgresqlDbStore` class.

3. **Initialization:** Call the `initialize` method to create necessary tables in the database.

## Storing Events

To store a new event, use the `storeEvent` method. This method takes a `streamId` and event `data` as parameters and inserts the event into the database event-store.

```typescript
// Example - Storing a new Billboard event
await store.storeEvent('Billboard', {
  billboardTitle: 'Example Billboard',
  // Additional event data...
});
```

## Event Handling and State Update

The applyEventsAndUpdateState method processes events, applies corresponding handlers, and updates the state.

```typescript
// Example - Applying events and updating state
await store.applyEventsAndUpdateState('Billboard', eventHandlers);
```

## Defining New Events

1. **Define Event Data Structure:** Ensure the event data structure is well-defined.
2. **Add Case in** `storeEvent`: In the `storeEvent` method, add a case for the new event type. Insert the event into the database based on the stream type.

```typescript
switch (streamId) {
  case 'NewEventType':
    // Insert logic for the new event type...
    break;
  // Existing cases...
}
```

1. **Handle Event in `applyEventsAndUpdateState`:** In the `applyEventsAndUpdateState` method, add a corresponding handler for the new event type.

```typescript
for (const row of result.rows) {
  const event: Event = {
    version: row.version,
    data: row.data,
  };

  const handler = eventHandlers[row.data.type];
  if (handler) {
    currentState = handler(currentState, event);
  } else {
    console.error(`No handler found for type: ${row.data.type}`);
  }
  // Existing logic...
}
```

## Defining New Cases in Event Handlers and
`createOrUpdateStreamTable`

## Event Handlers

```typescript
export const eventHandlers: Record<string, any> = {
  NewEventType: (state: State, event: Event) => {
    // Handler logic for the new event type...
    return state;
  },
  // Existing handlers...
};
```

`createOrUpdateStreamTable`

```typescript
async createOrUpdateStreamTable(
  eventType: EventType,
  items: any[]
): Promise<void> {
  const client = await this.pool.connect();
  try {
    switch (eventType) {
      case 'NewEventType':
        // Insert logic for the new event type...
        break;
      // Existing cases...
    }
  } catch (error: any) {
    console.error('Error creating/updating stream table:', error.message);
  } finally {
    client.release();
  }
}
```

## Conclusion

This README provides a basic understanding of the event sourcing setup. Feel free to extend the functionality based on your application's needs.

