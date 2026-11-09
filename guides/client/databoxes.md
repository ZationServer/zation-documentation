# Databoxes

A client Databox mirrors the data of a server [Databox](guides/server/databoxes.md) and keeps it up to date automatically.

## Connect

```typescript
const profile = client.databox('profile/get');
await profile.connect('42');          // member (omit it for a StaticDatabox)

console.log(profile.data);            // readonly data
```

`connect` fetches the first data automatically (`autoFetch`, default `true`). 
The Databox reconnects automatically after a connection loss and reloads missed changes using the reload strategy.

## Options

```typescript
const chat = client.databox('chat/messages', {
    autoFetch: true,
    autoFetchData: {limit: 20},      // fetch input for the first fetch
    remoteOptions: {lang: 'de'},     // options validated with optionsInput on the server
    apiLevel: 2,
    sendTimeout: 3000,
    reloadStrategy: buildTimeBasedListStrategy({timestampKey: 'created'})
});
```

## Fetch More Data

For Databoxes that implement the `fetch` method, every `fetch` call loads the next page:

```typescript
await chat.connect('1');
await chat.fetch();                  // next page
await chat.fetch({limit: 50});       // with fetch input
```

The promise rejects with a `DbError` when no more data is available (server threw `NoDataError`).

## React to Changes

```typescript
chat.onDataChange((data, reason, storage) => {
    render(data);
});

chat.onDataTouch((data, reason) => {}); // also triggered by anyContentChange on the server

chat.onceDataChange().then(([data]) => {});
```

`DataEventReason` tells why the event was triggered (fetch, insert, update, delete, reload, ...).

The data is never changed in place: a change copies every object and array on its path, every other part keeps its identity. A reader can tell what changed by reference, and data handed out before keeps its content.

## Local Content

The local content API edits the data locally without contacting the server. It is useful for optimistic UI updates:

```typescript
chat.localContent.insert(tempId, message);
chat.localContent.filterByKey(tempId).delete();
```

## Signals

```typescript
await chat.transmitSignal('typing', {userId});
chat.onSignal('typing', (data) => {});
```

## Lifecycle

```typescript
chat.isConnected();
await chat.reload();                  // reload the data from the server
await chat.reset();                   // clear and fetch again
await chat.disconnect();              // disconnect and clear the storage

chat.onceConnect(() => {});
chat.onceDisconnect(() => {});
chat.onceKickOut((code, metadata) => {});
chat.onceClose((code, metadata) => {});
```

Call `disconnect` when the Databox is no longer needed (e.g. when a view is destroyed), otherwise the connection and its memory stay alive.
`client.disconnectAllDataboxes()` disconnects every Databox of the client.

## Storages

The data lives in a `DbStorage`. The main storage is accessible via `db.mainStorage`, and additional storages can be connected with `connectStorage` to keep filtered or sorted views of the same data.
Comparators (`setComparator`) keep key arrays sorted; value mergers (`setValueMerger`) control how new values are merged into existing ones.

## Reload Strategies

After a reconnect, the Databox has to catch up on missed changes. The strategy is defined on the server (`reloadStrategy` option) and can be overridden on the client:

| Strategy | Description |
| --- | --- |
| `HistoryBased` (default) | Re-fetches the data using the recorded fetch history. |
| `TimeBasedList` | For lists sorted by a timestamp: fetches until the last known timestamp is reached. |

Custom strategies can be registered with `registerReloadStrategy(name, builder)`.

Transactions of the server's `content().sync` name the transaction they were built on. When the Databox has another last transaction (another writer, a missed transaction), it does not apply them but reloads with the strategy and keeps its last data until the reload is done.

## React

The `zation-react-toolkit` package provides the hooks `useClient`, `useDatabox`, `useDataboxTracking` and `useDataboxSelector` to use Databoxes in React components.

`useDataboxTracking` re-renders on every data change. `useDataboxSelector(databox, selector, isEqual)` (or `useDatabox(...).withSelector(selector, isEqual)`) re-renders only when the selected part changes; since every changed part is a new object, the default comparison by reference is enough. A selector that builds a new array or object needs an equality function such as `shallowEqual`:

```typescript
const [volume] = useDatabox('cinema').withSelector((data) => data?.volume);
const [active] = useDatabox('devices').withSelector((data) => (data ?? []).filter((one) => one.active), shallowEqual);
```
