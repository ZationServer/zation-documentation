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

### Sync the Whole Content

`sync` is the recommended way to change a Databox: after updating the database, read the content and give it to `sync`. The Databox works out what changed and brings the clients there in one transaction. The other operations above stay for cases that need them.

```typescript
// after updating the database
this.content().sync({name: 'Cinema', volume: {level: 42}, modes});
this.content(userId).sync(await loadProfile(userId));
```

Each server keeps the content as the clients hold it (the shadow, per member): every key with the timestamp of its last change, deleted keys with the timestamp of the delete. It takes the transactions of all servers as they come and compares the next value with it: objects and key arrays key by key (a changed or new key goes out as an update that inserts a missing key, a removed key as a delete), every other value whole (arrays, a value of another kind). Parts that are the same object as in the last value are skipped first, so treat a value given to `sync` as immutable and keep unchanged parts as they are. An equal value sends nothing. The first `sync` of a server for a member sends the value whole, and so does the first one after a reload of its clients. `sync` is only available on the content head, not in a path or a bundle. The fetch should return the same content.

**Key arrays.** A key array (`buildKeyArray`) goes item by item, by the key of each item: a changed item sends what changed in it (an object in it key by key), a removed item a delete, a new item an insert at the end. The clients keep the order of the items they hold and append new ones, so the order of the next value has to be reachable that way: new items after all items the clients hold, in the order of the value, removed ones anywhere. An item that moves, or a new item before one the clients hold, sends the key array whole. Use a key array for a list whose items change one at a time (devices, messages); a plain array always goes whole.

A key array also goes whole when the deletes would cost the clients more than the whole one: a delete costs a client a pass over the key array, so a `sync` goes whole when its deletes times the items before are more than 64 times the items after (more than about 64 items of a long list, half of a short one, or all of them). Deleted items keep their timestamp on the server and the clients, up to 1024 or as many as the key array holds; with more, the next `sync` sends the key array whole, and its timestamp then stands for every item it does not hold.

```typescript
this.content().sync(this.buildKeyArray(await loadDevices(), 'id'));
```

**Several writers.** Any server can `sync` the same Databox (member). Per key, the change with the newer timestamp wins on every client, in whatever order the transactions come:

* A `sync` without a `timestamp` takes a timestamp newer than every transaction its server has seen and not behind the clocks of the other servers (a hybrid logical clock), so a change after one of another server wins also when that server's clock runs ahead. The rank of the server is the fraction of a millisecond: two servers never take the same timestamp.
* A change of another server that is still on its way when a server syncs: when the read value has it, the server sends it with its newer timestamp and the older transaction changes nothing; when the value does not have it, the server leaves the key alone and the change takes when it arrives.
* When two servers change the same key at the same moment to different values, the database holds the one that was written last, which the timestamps can not tell. The server of the newer transaction notices the older one when it comes in; then the clients of every server reload from the database. The same happens when a change would remove a newer one inside it.
* When two servers add items to the same key array at the same moment, the clients of each server get them in the order they arrive there, which can differ between servers. A server that gets an item of another server after a newer one it added itself (with `sync`) notices it, also when both added the same item; then the clients of every server reload from the database and hold its order. So write a key array with `sync` on every server. An `insert` of another server that adds an item makes the next `sync` send the key array whole, which brings the clients to one order again; until then they can differ. An upsert (`potentialInsert`/`potentialUpdate`) that adds an item on a server that does not `sync` the key array is not noticed: the order can stay apart until the key array goes whole.
* A server that writes a member without clients of it follows the member while it writes (`unregisterDelay` after its last `sync`), so it knows the changes of the others.

Read the content right before the `sync`: a value read before a change of another server reached this server sets the older values again (with a newer timestamp) until the next `sync` of the key.

Costs: the shadow takes about ten times the size of the content as JSON in memory (4.4 KB for a 415-byte state with 35 keys). A `sync` with one changed key takes about 1 µs for an unchanged object tree, about 6 µs for a freshly read value; a transaction of another server takes about 0.3 µs. One changed key sends about 45 bytes of operations instead of 440 bytes of the whole value; the timestamp adds four bytes. A conflict costs one reload per client. A deleted key takes about 125 bytes in the shadow and 60 bytes on a client.

### Options

Every operation accepts options:

| Option | Description |
| --- | --- |
| `if` | Conditions (`$contains`, `$matches`, `$not`) that must be true on the client before the operation is applied. |
| `potentialInsert` / `potentialUpdate` | Convert an update to an insert when the key does not exist (or vice versa). |
| `timestamp` | Custom timestamp; only newer operations are applied. |
| `code`, `metadata` | Custom information passed to the client's data change listeners. |
| `processComplexTypes` | Enable when the value contains binaries or streams. |

A change without operations (`anyContentChange`) counts at the time of the server. When your timestamps can run ahead of that clock (several changes in one millisecond, a clock of your own), give it one of them too (`this.anyContentChange(member, {timestamp})`): otherwise an earlier change with a later timestamp can win over it on the clients of a server that it reaches after they reloaded.

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
| `historyLength` | `100` (server config `databoxHistoryLength`) | Last transactions the Databox (each member) keeps to resume clients after a lost connection; `0` keeps none. |
| `historySize` | `65536` (server config `databoxHistorySize`) | Maximum size of these transactions in characters of JSON. |

A client that comes back after a lost connection gets the missed transactions while they are kept, otherwise the data, in one round trip.
See [Databox Protocol](guides/databoxProtocol.md).

### Recommended Settings

Each registered Databox (each member of a Databox family) keeps its own history, up to `historySize`.
The server config sets the defaults for all Databoxes (`databoxHistoryLength`, `databoxHistorySize`); the options of a Databox and the `databoxDefaults` of the app config take precedence.
`databoxHistoryBudget` limits the sum of all histories on the server (default 64 Mi characters, `null` for no limit).
Over it, the server drops the history that was used longest ago: a client that resumes there gets the data once, a client that was up to date resumes unchanged.
No client gets outdated data.

| Server | Settings |
| --- | --- |
| One server, few Databoxes and members | The defaults, or `databoxHistoryLength: 200` (`historyLength` on a Databox) for clients that are away longer. Memory does not matter. |
| Many members | `databoxHistoryLength: 20`, `databoxHistorySize: 8192` and a `databoxHistoryBudget` that fits the memory of the server. |

Example for 10,000 members:

* With the defaults, each history can grow to 65536 characters: 655 M characters (about 625 MiB) at worst; the default budget stops at 64 Mi.
* With `databoxHistorySize: 8192`: 82 M characters at worst. A typical transaction has 100 to 400 characters, so 20 transactions take about 4,000.
* `databoxHistoryBudget: 16777216` (16 Mi characters) keeps the histories of the about 4,000 members used last (2,048 full ones). The clients of the others get the data when they resume after missed changes.

A character of JSON takes one byte in memory (two in a transaction with characters outside Latin-1), plus about 30 bytes per transaction.
The budget costs less than 0.02 µs per transaction.

```typescript
Config.serverConfig({
    databoxHistoryLength: 20,
    databoxHistorySize: 8192,
    databoxHistoryBudget: 16 * 1024 * 1024
}).register();
```

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
