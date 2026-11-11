# Events

The client emits events for the connection and authentication state.

```typescript
client.onConnect((initial) => {});                 // initial: first connect or reconnect
client.onDisconnect((code, reason, permanent) => {}); // permanent: no reconnect follows
client.onConnectAbort((code, reason) => {});
client.onNextReconnectChange((at) => {});           // the next attempt (Date.now() time) or null
client.onAuthenticate(() => {});
client.onDeauthenticate(() => {});
client.onError((err) => {});
```

Every event has three variants:

| Method | Description |
| --- | --- |
| `on<Event>(listener)` | Listen permanently. |
| `once<Event>(listener)` | Listen once. Without a listener it returns a promise that resolves with the event arguments; an optional timeout rejects with a `TimeoutError`. |
| `off<Event>(listener?)` | Remove one or all listeners. |

```typescript
await client.onceConnect(5000);
await client.onceAuthenticate();
```

Databoxes and Channels provide the same pattern for their own events, see [Databoxes](guides/client/databoxes.md) and [Channels](guides/client/channels.md).
