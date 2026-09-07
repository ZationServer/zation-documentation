# Channels

A client subscribes to a server [Channel](guides/server/channels.md) and receives the published events.

## Subscribe

```typescript
const chat = client.channel('chat');
await chat.subscribe('1');            // member (omit it for a StaticChannel)

chat.onPublish('message', (data) => {
    console.log(data);
});
```

Register the publish listeners before or after subscribing; they stay registered until `offPublish` is called.
Subscriptions are restored automatically after a reconnect.

## Unsubscribe

```typescript
chat.unsubscribe();
client.unsubscribeAllChannels();        // all channels
client.unsubscribeAllChannels('chat');  // all members of one channel
```

## Events

```typescript
chat.onSubscribe(() => {});
chat.onUnsubscribe((reason) => {});     // UnsubscribeReason: Client, KickOut, Disconnect, Close
chat.onKickOut((code, metadata) => {});
chat.onClose((code, metadata) => {});
chat.oncePublish('message').then(([data]) => {});
chat.isSubscribed();
```

Every `on*` method has `once*` (also awaitable with an optional timeout) and `off*` counterparts.

## Publishing

Clients can not publish into a channel directly. Send the data to a [Receiver](guides/client/receivers.md) or Controller, which validates it and publishes on the server.
