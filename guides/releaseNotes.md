# Release Notes

## zation-server 3.0.0-beta.3, zation-client 3.0.0-beta.2, zation-react-toolkit 1.8.0

### Batching

* `batch: 0` bundles the packages of one event loop turn and sends them at its end, without a timer. Before, `0` sent each package directly. `null` still sends directly.
* The default `batch` of Databoxes and Channels is `0` instead of `100` ms: a single change goes out at once, changes made together still go out as one message.

### Databox `content().sync`

* `content().sync(value)` and `content(member).sync(value)` take the whole content and send only what changed since the last synced value, as one transaction.
* Each of these transactions names the transaction it was built on. A client with another last transaction reloads instead of applying it.
* Use one writer per Databox (member). Several writers cost reloads.

### Client Data

* `data` and the data of `dataChange` are immutable snapshots: a change copies the objects and arrays on its path, every other part keeps its identity.
* Don't change them. To change the data, use `getDataClone()`.

### React

* `useDataboxSelector(databox, selector, isEqual)` and `useDatabox(...).withSelector(selector, isEqual)` re-render only when the selected part changes.
* `shallowEqual` for selectors that build a new array or object.

### Connection

* ziron-client 9.12.0 drops a connection whose ping timeout has passed by the wall clock when the page becomes visible or the network comes back. After a device slept, it reconnects at once instead of after up to 10 s.

### Order of Publishing

1. `ziron-engine` 2.6.0
2. `ziron-server` and `ziron-client` 9.12.0 (with `ziron-engine` 2.6.0), then `ziron-worker`, `ziron-broker` and `ziron-state` 9.12.0
3. `zation-server` 3.0.0-beta.3 (`ziron-worker` 9.12.0) and `zation-client` 3.0.0-beta.2 (`ziron-client` 9.12.0) together
4. `zation-react-toolkit` 1.8.0 (peer `zation-client` ^3.0.0-beta.2)

With an older `ziron-engine`, `batch: 0` sends each package directly.
