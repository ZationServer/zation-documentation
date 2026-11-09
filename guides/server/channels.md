# Channels

Channels push events from the server to subscribed clients (publish/subscribe).
Unlike Databoxes, Channels do not keep state: clients only receive events that are published while they are subscribed.

| Class | Description |
| --- | --- |
| `Channel` | A Channel family. Clients subscribe to a specific **member** (e.g. a chat id). |
| `StaticChannel` | A single Channel without members, e.g. a news channel. |

## Define a Channel

```typescript
import {Channel, Socket} from "zation-server";

@Channel.Config({
    access: 'allAuth'
})
export default class ChatChannel extends Channel<string> {

    protected async onSubscription(member: string, socket: Socket) {
        // e.g. check that the user is part of the chat or log the subscription
    }

}
```

```typescript
import {StaticChannel} from "zation-server";

@StaticChannel.Config({
    access: 'all'
})
export default class NewsChannel extends StaticChannel {}
```

## Publish

Clients can not publish directly into a channel. Use a Receiver or Controller to validate the data and publish from the server:

```typescript
@Receiver.Config({access: 'allAuth', input: ChatMessage})
export class PublishMessage extends Receiver {

    @Inject(ChatChannel)
    private readonly chatChannel: ChatChannel;

    handle(socket: Socket, input: ChatMessage) {
        this.chatChannel.publish(input.chatId, 'message', {
            userId: socket.userId,
            content: input.content
        });
    }

}
```

`publish(member, event, data, options)` sends the event to all subscribers of the member on every server in the cluster.
For static channels the signature is `publish(event, data, options)`.
Pass `publisherSid: socket.sid` in the options to exclude the publishing socket from receiving the event.
Set `processComplexTypes: true` when the data contains binaries or streams.

## Other Methods

```typescript
await this.close(member, code, metadata); // close the member for all subscribers
this.kickOut(member, socket, code);      // remove a socket from the member
await this.recheckMemberAccess(member);  // re-evaluate the access rules of all subscribers
this.getSocketSubMembers(socket);        // members the socket has subscribed
```

## Hooks

```typescript
protected onSubscription(member, socket) {}
protected onUnsubscription(member, socket, trigger) {} // trigger: Client, Disconnect, KickOut, Close
protected onPublish(member, event, data) {}
protected memberMiddleware(member) {}  // return false or a Block to reject a member
```

## Configuration

| Option | Default | Description |
| --- | --- | --- |
| `access` | | Access rules; the function variant receives `(socket, {member})`. |
| `memberInput` | string | Model to validate the member. |
| `maxSocketMembers` | `20` | Max members a socket can subscribe to in this channel. |
| `unregisterDelay` | `120000` | Delay before an unused member is cleaned up. |
| `batch` | `0` | Bundling of outgoing packages: `0` bundles the publishes of one event loop turn and sends them at its end (no timer), a number above 0 waits up to that many ms, `null` sends each package directly. |

The server config option `socketChannelLimit` limits the total number of channel subscriptions per socket.

## Type-Safe Events

The generic parameter of `Channel<M>` describes the member type. 
The events a channel publishes can be described on the client side with a `ChannelDef` in the [API definition](guides/client/apiDefinition.md), so listeners get typed data.

Read the [Client Channels](guides/client/channels.md) chapter to learn how clients subscribe.
