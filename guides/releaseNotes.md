# Release Notes

## zation-client 3.0.0-beta.4, zation-server 3.0.0-beta.4, zation-assured 3.0.0-beta.4, zation 3.0.0-beta.4

* Browser bundlers (Vite, webpack, Rollup, esbuild) load the client without a plugin and without a `define`. The bundle requires its dependencies by their literal names (`ziron-client`, `queric`, `emitix`) and uses `globalThis` instead of `global`. Before, the obfuscator turned some of these names into computed calls (`require(_0x…)`), which no bundler follows, and the UMD wrapper used the node only `global`.
* A plugin that patched these calls and `define: {global: 'globalThis'}` for the client are no longer needed.
* The code stays obfuscated as before. Each build checks the bundle: literal requires of the dependencies only, no `global`, no plain local name, no source map, only `dist` with the declarations in the package.
* zation-server and zation (CLI) only take the new version, zation-assured also `zation-client` 3.0.0-beta.4. The templates of the CLI use 3.0.0-beta.4. zation-state and zation-broker stay 8.0.0-beta.2. zation-react-toolkit 1.8.1 takes this client (`^3.0.0-beta.3`).

## zation-react-toolkit 1.8.1

* `useDatabox` takes `enabled` in its options: with `false` the component does not connect the Databox, for data that is only wanted after a login or while a part is open. Switching it to `true` connects it.
* The peer dependency is `zation-client` `^3.0.0-beta.3` instead of exactly `3.0.0-beta.3`, so a newer client does not need a new toolkit.

## zation-server 3.0.0-beta.3, zation-client 3.0.0-beta.3, zation-react-toolkit 1.8.0

### Batching

* `batch: 0` bundles the packages of one event loop turn and sends them at its end, without a timer. Before, `0` sent each package directly. `null` still sends directly.
* The default `batch` of Databoxes and Channels is `0` instead of `100` ms: a single change goes out at once, changes made together still go out as one message.
* The buffers of one turn flush with one callback (ziron-engine), not one `setImmediate` each.

### Databox `content().sync`

* `content().sync(value)` and `content(member).sync(value)` take the whole content and send only what changed, as one transaction: objects key by key, other values whole. It is the recommended way to change a Databox; the other operations stay.
* Several servers can sync the same Databox (member). Each server compares with the content as the clients hold it (its shadow, with the timestamp of every key) and takes the changes of the others; per key the newer timestamp wins on every client.
* Transactions without a `timestamp` take one newer than every transaction the server has seen and not behind the clocks of the other servers, with the rank of the server as the fraction of a millisecond: a server whose clock runs behind does not lose its later changes. Servers send their clock with each transaction to the other servers for this; fetched data takes the same time.
* Two servers that set the same key at the same moment to different values make the clients of every server reload from the database.

### Client Data

* `data` and the data of `dataChange` are immutable snapshots: a change copies the objects and arrays on its path, every other part keeps its identity.
* Don't change them. To change the data, use `getDataClone()`.
* After a transaction, only the components it creates get the comparators and value mergers of the storage (a constraint with a query still checks all). Before, a comparator without a selector went through the whole data with each transaction.
* Fixed: a comparator or value merger with a selector of more than one key selected other components or none from its second update on.

### Databox Transactions

* A transaction is converted to JSON once for the other servers, the history and the clients (without complex types; a transaction middleware gets objects). With the history and the other small changes, a transaction takes about 0.6 µs on the server that receives it from another server instead of 1.2 µs, and 1.0 µs on the server that emits it instead of 2.1 µs.

### React

* `useDataboxSelector(databox, selector, isEqual)` and `useDatabox(...).withSelector(selector, isEqual)` re-render only when the selected part changes.
* `shallowEqual` for selectors that build a new array or object.
* `useDatabox` shares one Databox and its connection between the components with the same client, identifier, member and options, and disconnects it 3 s after the last of them unmounted. Before, each component connected its own, and a route change or the strict mode of React connected again.
* `useConnected`, `useAuthenticated` and `useAuthTokenPayload` re-render on the connection and token events of the client.
* `useRequest(request, isEnabled)` sends a request once and again with `reload`, with `data` and `error`.
* See [React](guides/client/react.md).

### Databox Connect and Resume (protocol version 1)

* The first data comes with the connect response: one round trip instead of two.
* After a lost connection, a Databox tells the server where its data stands. The server answers in one round trip with unchanged, the missed transactions or the data. Before, a change while away cost four round trips until the data.
* Servers keep the last transactions of each Databox (member) for this: `historyLength` (default `100`) and `historySize` (default `65536` characters).
* `databoxHistoryLength` and `databoxHistorySize` in the server config set these defaults for all Databoxes; the options of a Databox and `databoxDefaults` take precedence.
* `databoxHistoryBudget` in the server config limits all histories of a server (default 64 Mi characters, `null` for no limit). Over it, the history used longest ago is dropped: a client that resumes there gets the data once. See [Recommended Settings](guides/server/databoxes.md#recommended-settings).
* Where the server can not tell, or with an older server, the reload sends the session reset together with its fetches and shows the data without waiting for the session copy: two round trips instead of four.
* The connect requests of all Databoxes after a reconnect go out as one message.
* Every combination of old and new clients and servers works; see [Databox Protocol](guides/databoxProtocol.md).
* Databox tokens are valid on every server of a cluster. Before, each server signed them with its own secret, so a client reloaded after every server switch.

### Missed Transactions in a Cluster

* A client never keeps wrong data when its server missed a transaction of another server: the client reloads. Before, a cut broker connection, a broker restart, a publish lost on the way, a cut subscribe or a server that died with unsent transactions left clients with wrong data until the next reload.
* Each transaction carries its chain (`k`, `q`): the transactions of one server for a Databox (member). A server or client that sees a position skipped reloads instead of applying it.
* While its subscription at the broker is cut, a server answers resumes with the data; when it is active again, its clients reload. A new member waits up to 1 s for its subscription.
* A server whose publishes may not have reached the broker sends a gap notice; when a server leaves the cluster, the others reload the clients of all their members.
* Fetched data carries the chain heads it holds, so a client that comes back on another server resumes there when nothing changed.
* A delete of a key the client does not have keeps its timestamp, so an older set of another server that comes later does not bring the key back.
* See [Databox Protocol](guides/databoxProtocol.md#cluster-missed-transactions) for the fields, what the application has to do and the cost.

### ziron Cluster

* The channel exchange tells whether a subscription at the broker is active (`isSubscriptionActive`), when it becomes active or is cut (`onSubscriptionChange`) and about publishes that may not have reached the broker (`onPublishLoss`).
* The broker pool repeats a subscribe that a lost connection cut; before, the server missed the channel until it subscribed again. A channel that moves to another broker stays subscribed at the old one for 5 s.
* The state server tells the workers when a worker leaves (`workerLeave`).
* The channel exchange publishes a `JSONString` (prepared JSON, without complex types) without converting it again: the other servers and the sockets get the same message as from the value, the listeners of the server itself the `JSONString`.

### Connection

* ziron-client 9.12.0 drops a connection whose ping timeout has passed by the wall clock when the page becomes visible or the network comes back. After a device slept, it reconnects at once instead of after up to 10 s.

### Order of Publishing

1. `ziron-engine` 2.6.0
2. `ziron-server` and `ziron-client` 9.12.0 (with `ziron-engine` 2.6.0), then `ziron-worker`, `ziron-broker` and `ziron-state` 9.12.0 (`ziron-worker` with the broker signals and `workerLeave`, `ziron-state` with `workerLeave`)
3. `zation-server` 3.0.0-beta.3 (`ziron-worker` 9.12.0) and `zation-client` 3.0.0-beta.3 (`ziron-client` 9.12.0) together; `zation-state` and `zation-broker` 8.0.0-beta.2 with `ziron-state` and `ziron-broker` 9.12.0; `zation-assured` 3.0.0-beta.3
4. `zation` (CLI) 3.0.0-beta.3: new projects start with these versions
5. `zation-react-toolkit` 1.8.0 (peer `zation-client` 3.0.0-beta.3)

With an older `ziron-engine`, `batch: 0` sends each package directly.
zation-server and zation-client can be published in either order for the Databox protocol: each works with the older version of the other.
Afterwards, zation-integration-test takes the new zation-server and zation-client; its resume tests need protocol version 1, its cluster loss tests and the soak run (`soak/run.ts`) the chain and ziron 9.12.0. ziron-integration-tests takes ziron 9.12.0 for its broker loss tests.
