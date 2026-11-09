# Databoxes

A Databox provides data to clients and keeps it synchronized in real time.
The client connects to a Databox, fetches the data and gets every change (insert, update, delete) pushed automatically.
Databoxes handle reconnects, missed changes (reload strategies), pagination (multiple fetches) and work across a cluster.

There are two variants:

| Class | Description |
| --- | --- |
| `Databox` | A Databox family. The client connects to a specific **member** (e.g. a user id or chat id). Every member has its own data. |
| `StaticDatabox` | A single Databox without members, e.g. a product list or a global configuration. |

## Define a Databox

```typescript
import {Databox, FetchRequest, DbInConnection, NoDataError} from "zation-server";

interface Profile {
    id: string,
    name: string,
    age: number
}

@Databox.Config({
    access: 'allAuth'
})
export default class ProfileDatabox extends Databox<Profile, string> {

    protected async singleFetch(request: FetchRequest, connection: DbInConnection<string>) {
        const profile = await db.profiles.findById(connection.member);
        if(!profile) throw new NoDataError();
        return profile;
    }

}
```

The generic parameters describe the content type and the member type. They are used for type-safe content updates and for the client API definition.

### Fetch Methods

Only one of the two fetch methods should be overridden.

**singleFetch(request, connection)**  
Returns the complete data in one call. The client can fetch only once.

**fetch(request, connection, session)**  
Is called every time the client fetches. Use it to load data in pages (e.g. chat messages):

```typescript
protected async fetch(request: FetchRequest, connection: DbInConnection<string>, session: Record<string, any>) {
    const messages = await db.messages.find({chatId: connection.member})
        .skip(request.counter * 20).limit(20);
    if(messages.length === 0) throw new NoDataError();
    return this.buildKeyArray(messages.map(m => [m.id, m]));
}
```

| Parameter | Description |
| --- | --- |
| `request.counter` | Number of the current fetch, starting at 0. Only increases on success. |
| `request.input` | Data the client sent with the fetch (validated with `fetchInput`). |
| `request.reload` | `true` when the fetch is part of a reload. |
| `connection.member` | The member (only in `Databox`). |
| `connection.socket` | The socket of the client. |
| `connection.options` | Options the client sent when it connected (validated with `optionsInput`). |
| `session` | Server-side object to store state between fetches (must be JSON compatible). |

Throw a `NoDataError` (or return `undefined`) when no more data is available. Returning `null` is treated as regular content, so a Databox can express a state where the content legitimately is null.
If the fetches are independent of each other, activate `parallelFetch` in the config.

### Data Structures

The client converts the returned data into storage components:

* **Object**: every JSON object. Values are accessed by property key.
* **Array**: every JSON array. Values are accessed by index; the index is the key.
* **KeyArray**: an ordered list where every item has a string key. Build it with `this.buildKeyArray([[key, value], ...])`. Use it for lists that are changed often (chat messages, product lists).

When the client fetches more data, the new data is merged with the existing data component by component.

## Update Content

Whenever the underlying data changes, inform the Databox so that all connected clients are updated.
Use the `content` API (typically after updating your database):

```typescript
// StaticDatabox
this.content().insert('42', {name: 'Laptop', price: 800});
this.content().filterByKey('42').update({name: 'Laptop', price: 700});
this.content().filterByKey('42').delete();

// Databox family: select the member first
this.content(userId).update({name: 'Luca', age: 23});
this.content(userId).insert('nickname', 'lu');
```

The selectors navigate through the data. `filterByKey`, `filterByValue` and `filterByPair` accept [queric](https://www.npmjs.com/package/queric) queries, `all()` selects all items:

```typescript
this.content(chatId).filterByValue({userId: 10}).delete();
this.content().all().update({available: false});
this.content(chatId).insert('$nextIndex', message); // append to a plain array
```

### Bundles (Transactions)

Multiple operations can be bundled into one transaction, so the clients apply them atomically:

```typescript
this.content(chatId, true)
    .insert(message.id, message)
    .filterByKey(oldMessageId).delete()
    .commit();
```

In a bundle, `partialUpdate({...})` updates only the given properties of an object.

### Set the Whole Content

`set` takes the whole new content and sends only what changed against the last value given to `set`, as one transaction:

```typescript
this.content().set({name: 'Cinema', volume: {level: 42}, modes});
this.content(userId).set(profile);
```

Objects are compared key by key, arrays index by index (appended items become inserts, items removed from the end deletes) and key arrays key by key. Parts that are the same object as in the last value are skipped first, so treat a value given to `set` as immutable and keep unchanged parts as they are. The first `set` sends the value whole, an equal value sends nothing. A list of four or more items where most items changed, a reordered key array and a value of another kind go out whole. `set` is only available on the content head, not in a path or a bundle.

### Options

Every operation accepts options:

| Option | Description |
| --- | --- |
| `if` | Conditions (`$contains`, `$matches`, `$not`) that must be true on the client before the operation is applied. |
| `potentialInsert` / `potentialUpdate` | Convert an update to an insert when the key does not exist (or vice versa). |
| `timestamp` | Custom timestamp; only newer operations are applied. |
| `code`, `metadata` | Custom information passed to the client's data change listeners. |
| `processComplexTypes` | Enable when the value contains binaries or streams. |

## Other Methods

```typescript
this.forceReload(member);             // clients reload the data
this.close(member, code, metadata);   // close the member for all clients
this.kickOut(member, socket, code);   // kick a socket out
this.transmitSignal(member, 'typing', {userId});
this.anyContentChange(member);        // notify clients that something changed (touch)
await this.recheckMemberAccess(member);
this.getSocketRegMembers(socket);
```

Static Databoxes have the same methods without the member parameter.

## Hooks

```typescript
protected onConnection(member, socket) {}
protected onDisconnection(member, socket) {}
protected onTransaction(member, transaction) {}
protected onReceivedSignal(connection, signal, data) {}
protected memberMiddleware(member) {}          // return false or a Block to reject a member
protected transactionMiddleware(member, socket, transaction) {} // filter operations per socket
protected transmitSignalMiddleware(member, socket, signalAction) {}
```

## Signals

Signals are lightweight messages between the client and the Databox that do not change the data:

```typescript
// server -> clients
this.transmitSignal(chatId, 'typing', {userId: socket.userId});

// client -> server
protected onReceivedSignal(connection: DbInConnection<string>, signal: string, data: any) {
    if(signal === 'read') this.transmitSignal(connection.member, 'read', {userId: connection.socket.userId});
}
```

## Configuration

| Option | Default | Description |
| --- | --- | --- |
| `access` | | Access rules; the function variant receives `(socket, {member})`. |
| `memberInput` | string | Model to validate the member. |
| `fetchInput` | `'nothing'` | Model for the data the client sends with a fetch. |
| `optionsInput` | `'nothing'` | Model for the options the client sends when connecting. |
| `parallelFetch` | `false` | Allow parallel fetches. |
| `maxBackpressure` | `30` | Max pending fetches per client. |
| `maxSocketInputChannels` | `10` | Max independent sessions of one socket to the same member. |
| `maxSocketMembers` | `20` | Max members a socket can connect to. |
| `initialData` | | Initial data for clients (e.g. an empty key array). |
| `reloadStrategy` | HistoryBased | Strategy the client uses to reload data after a reconnect. |
| `unregisterDelay` | `120000` | Delay before an unused member is cleaned up. |
| `fetchLastTransactionData` | `500` | Timeout to fetch the last transaction from other servers in a cluster. |
| `batch` | `0` | Bundling of outgoing packages: `0` bundles the packages of one event loop turn and sends them at its end (no timer), a number above 0 waits up to that many ms, `null` sends each package directly. |

## Using Databoxes in Other Components

Inject the Databox into a Controller or Receiver:

```typescript
@Receiver.Config({access: 'allAuth', input: Product})
export class AddProduct extends Receiver {

    @Inject(ProductsDatabox)
    private readonly productsDatabox: ProductsDatabox;

    async handle(socket: Socket, product: Product) {
        await db.products.insert(product);
        this.productsDatabox.content().insert(product.id, product);
    }

}
```

Read the [Client Databoxes](guides/client/databoxes.md) chapter to learn how clients consume Databoxes.
