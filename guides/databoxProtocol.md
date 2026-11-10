# Databox Protocol

How a client Databox and a server Databox talk to each other, what changed with protocol version 1
(zation-server 3.0.0-beta.3, zation-client 3.0.0-beta.2) and how old and new versions work together.

## Messages

| Message | Way | Content |
| --- | --- | --- |
| Connect request | client → server, procedure `D>` | `DataboxConnectReq` |
| Connect response | server → client, answer of the request | `DataboxConnectRes` |
| Actions | client → server, input channel (`i` of the response) | procedures `fetch`, `resetSession`, `copySession`, `getLastTransactionId`; transmits `signal`, `disconnect` |
| Output packages | server → client, output channel (`o` of the response) | `transaction`, `reload`, `close`, `kickOut`, `signal` |

The token (`t`) is signed by the server. It holds the options and two fetch sessions (main and reload) with their counter and data.
A token of one server is valid on every server of the cluster (they share the secret once they joined).

## Version 0

Connect request: `{d, m?, a?, t?, o?}` (Databox, member, API level, token, options).
Connect response: `{i, o, lt, p, bp?, id?, rs?}` (input channel, output channel, last transaction id, parallel fetch, backpressure, initial data, reload strategy).

| Case | Flow | Round trips until the data |
| --- | --- | --- |
| First contact | connect, then `fetch` (main session) | 2 |
| Reconnect, `lt` is the last transaction of the client | connect | 1 |
| Reconnect, otherwise | connect, `resetSession` (reload session), `fetch` for each fetch of the history, `copySession`, then `getLastTransactionId` | 4 (5 until the reload ends) |

## Version 1

### Connect Request

New fields:

| Field | Value | Meaning |
| --- | --- | --- |
| `v` | `1` | Protocol version of the client. Older servers ignore it. |
| `f` | `{i?}` | Fetch with the input `i` during the connect and send the data with the response. First contact: the `autoFetchData` (only with `autoFetch`). Reconnect: the input of the only fetch when one fetch (counter 0) loaded the data and the reload strategy is `HistoryBased`. |
| `r` | `{h?, n?, i, c?}` | Reconnect only, with the token: where the data of the client stands. History id `h` and position `n` it got last from that server, last transaction id `i`, chain heads `c` (`[k, q]` since its data was loaded). Not sent while a reload runs or after a reload failed. |

### Connect Response

New fields, only when the request has `v`:

| Field | Value | Meaning |
| --- | --- | --- |
| `v` | `1` | Protocol version of the server. |
| `h` | string | Id of the history of the Databox (member) on this server. It is new with every registration. |
| `n` | number | The position in the history that the response brings the client to. |
| `r` | `0`, `1`, `2` or missing | `0` unchanged; `1` the missed transactions are in `tx`; `2` the data is in `f`, followed by the transactions in `tx`. Missing: the client fetches (first contact) or reloads (reconnect) by itself. |
| `f` | `{c, d, t, ti, k}` | The fetched data like a fetch response: counter, data, new token, timestamp, chain heads. |
| `tx` | transactions | With `r: 1` the missed transactions, with `r: 2` the transactions that came during the fetch. |

`lt` stays the last transaction id the server knows.

### Output Packages

| Package | New field | Meaning |
| --- | --- | --- |
| `transaction` | `n` | Position of the transaction in the history of this server. |
| `reload` | `n` | Position of a forced reload. It takes a position, so no client resumes across it. |

Servers send `n` to every client; older clients ignore it.

### Server

Each registered Databox (each member of a Databox family) keeps a history: its last transactions in the order this server processed them, its own and those of other servers (via the broker), as JSON.
The configuration options `historyLength` (default `100`, `0` keeps none) and `historySize` (default `65536` characters) limit it.
Forced reloads and transactions with complex types take a position without an entry.
The server config sets their defaults and `databoxHistoryBudget`, the limit of all histories on the server: over it, the server drops the entries of the history that was used (written or replayed) longest ago.
A dropped history keeps its position. When it held a position without an entry (a forced reload), the newest position becomes one, so no client of another server resumes across the reload.

A connect request with `v`:

1. Checks access, token and options as before.
2. Finds where the client stands (the base):
    * With the id of this history: the position `n` when every transaction after it is kept and can be replayed. With a transaction middleware only when nothing came after it, because each missed transaction would need the middleware for this socket.
    * With another id (another server, another registration): the newest position when `i` is the last transaction id, no kept entry is a reload and the chain heads `c` are the same as the ones of the server (the chains it follows and its own). The transactions of several servers come in another order on each server: the last transaction id alone does not tell that the client has every older one.
3. Without a base and with `f`: fetches on a new main session (counter 0) before the socket joins. The base is the position when the fetch started. Errors give no data: the client fetches by itself and gets the error then.
4. Registers the socket. In the same turn, it adds `h`, `n`, `r` and the transactions after the base (`tx`). When the Databox registered again meanwhile, or a transaction after the base can not be replayed, `r` stays empty.
5. Only when the data goes out, the input channel takes the new main session.

Every package after the response has a position above `n`. A package with a position up to `n` that still comes after the response (a bundle of the same turn) is in the response already.

### Client

* Sends `v`, `f` and `r` as described. The connect requests of one microtask round (all Databoxes after a reconnect) go out as one message.
* While its request is on its way, the Databox holds the packages of its output channel (another Databox on the socket may have connected already).
* `r: 0`: nothing to do. `r: 1`: applies `tx` in order. `r: 2`: takes `f` (first contact like a fetch, reconnect like a reload) and applies `tx` on it; a transaction of unknown content in `tx` starts a reload.
* Takes `n` as its position: held and later packages up to `n` are skipped.
* Without `r` from a server of version 1: fetches (first contact) or reloads (reconnect).
* Without `v` (older server): works like version 0 and forgets the position.

A reload sends `resetSession` together with its fetches and does not wait for `copySession` before it shows the data (a resync of `content().sync` still does).

| Case | Round trips until the data |
| --- | --- |
| First contact | 1 |
| Reconnect, unchanged, missed transactions or data | 1 |
| Reconnect, the server can not tell (no `r`) or an older server | 2 (connect, then `resetSession` with `fetch`; `copySession` follows in the background) |

### Compatibility

| Client | Server | Flow |
| --- | --- | --- |
| before 3.0.0-beta.2 | before 3.0.0-beta.3 | version 0 |
| 3.0.0-beta.2 | before 3.0.0-beta.3 | The server ignores `v`, `f` and `r` and answers without `v`: the client works like version 0 (with the faster reload). |
| before 3.0.0-beta.2 | 3.0.0-beta.3 | No `v`: the server answers like before. The client ignores `n`. |
| 3.0.0-beta.2 | 3.0.0-beta.3 | version 1 |

In a cluster with old and new servers, a client can move between them: on an old server it works like version 0, on a new one it resumes by its last transaction id or gets the data.

### Edge Cases

* **Another server:** the history id differs, so the client resumes only by its last transaction id and the same chain heads (unchanged) or gets the data.
* **Expired history:** more transactions than `historyLength`, more than `historySize`, the budget of the server dropped the history, or the Databox unregistered after `unregisterDelay` without clients: the client gets the data. A client at the newest position of a dropped history resumes unchanged.
* **Changes during the resume:** the response covers everything up to `n`, later changes come as packages; nothing is applied twice.
* **Forced reloads:** a client that comes back to the server gets the data. On another server, too, while the reload is in its history (also when the budget dropped the history). As before, `forceReload` only reaches connected clients for sure; use `anyContentChange` for changes everyone has to get.
* **`content().sync`:** missed synced transactions come in order like any other.

## Cluster: Missed Transactions

Servers pass transactions to each other over the broker. Before zation-server 3.0.0-beta.3, a server could miss one without noticing (its broker connection was cut, the broker restarted, a publish was lost on the way, a subscribe was cut, the server that emitted died) and its clients kept wrong data until the next reload.

### Guarantee

A client never keeps wrong data: when a transaction may be missing, its server (or the client itself) reloads the data from the source. In between, data can be out of date. A server, after its broker connection was cut, answers resumes with the data until its subscription is active again.

What it takes from the application: write the source before emitting, as before. Changes of the same key from several servers need `content().sync`, or timestamps in the order of the source (`timestamp` option) and the forms that do not depend on the order: `update` with `potentialInsert`, `insert` with `potentialUpdate`, and `delete`. A plain `insert`/`update` of a missing key, `if` conditions and list indexes depend on the order in which the transactions come; for those, use one writer per Databox (member).

### How a Server Notices

| Case | Noticed by | Then |
| --- | --- | --- |
| Its subscription at the broker was cut (connection lost, broker restarted, channel moved to another broker) | ziron: `onSubscriptionChange(channel, false)` | The member is unsure: resumes get the data. When the subscription is active again (`true`), its clients reload, the history takes a position (no resume across it) and the last transaction id becomes unknown. |
| A new member: its subscription is not active yet | `isSubscriptionActive(channel)` | It waits up to 1 s before it serves clients. Clients that got data or `lt` before the subscription was active reload then. |
| Its own publish may not have reached the broker (not confirmed before the connection broke, buffered in a pool that was dropped, no broker) | ziron: `onPublishLoss(channel)` | It sends a gap notice; every other server resets the member (reload, history position, unknown last transaction id). |
| A transaction of another server is missing between two that came (or came in another order) | the chain (`k`, `q`) | The server does not pass the transaction on, it resets the member. |
| Another server left the cluster (it can not tell about its lost publishes), or this server joined the state server again | ziron: state client `workerLeave` | It resets every member. |

ziron confirms the publishes of a broker connection with one acknowledged publish in the unused channel `#barrier` per round trip (the broker processes the messages of a connection in order). A subscribe that was cut by a lost connection is repeated.

### Fields

| Field | Where | Meaning |
| --- | --- | --- |
| `k` | transaction (between servers and to clients) | The chain: the transactions of one server for this Databox (member). A server keeps 10000 chains per Databox; a member that comes back after that starts a new chain. |
| `q` | transaction | Position in the chain. The next transaction of the chain has `q + 1`. |
| `g` | reload package of a broadcast (between servers only) | Gap notice with the chain head `[k, q]` of the sending server (or `1`). The receiving servers send their clients a plain reload. |
| `k` | fetch response (also `f` of the connect response) | The chain heads `[k, q]` the data holds: the chains the server follows and its own, taken when the fetch starts. |

Clients with a transaction middleware get transactions without `k` and `q`: they do not get every transaction of a chain.

### Client

A client follows the chains from the heads of its fetched data (up to 64 chains). A transaction whose chain skips a position is not applied: the client reloads. A transaction the heads hold already is applied as usual (the fetch response can overtake it on the socket; its timestamp is not newer than the data). A reload or data from the connect response starts the chains anew. With the heads of its data, a client that comes back on another server resumes there when nothing changed.
A delete of a key the client does not have keeps its timestamp: an older set of another server that comes later does not bring the key back.
Fetched data has at least the timestamp of the newest transaction the server saw for the Databox (member), so an older transaction that comes later does not override it. See [Several Writers](#several-writers-contentsync) for when it has exactly that timestamp.

### Compatibility

* Older clients ignore `k` and `q`. Older servers pass `k` and `q` on to their clients: a new client then notices a gap they did not (with a transaction middleware on such a server, it reloads more often than needed).
* Older servers take a gap notice as a forced reload of their clients.
* Without ziron 9.12.0 (ziron-worker, ziron-server, ziron-state) the signals are missing; the chain still catches a gap between two transactions of a server.
* Clients of version 0 (before 3.0.0-beta.2) send no resume point: after a reconnect they keep their data when the `lt` of the connect response is their last transaction id. On another server this can hide an older transaction of a third server that came there after it. This was the case before; the chains of new servers do not change it, updated clients do.

### Cost

| What | Cost |
| --- | --- |
| Chain per transaction | about 25 bytes (`"k":"…","q":…`), 0.04 µs to emit, 0.03 µs to check |
| Barrier | one acknowledged publish (about 30 bytes, answer about 10 bytes) per round trip and broker connection, only while publishing |
| Memory | up to 64 followed chains per member (server and client), up to 10000 own chains per Databox |
| Reloads | a cut subscription, a lost publish or a server that left reloads the clients of the members concerned (on a server that left: every member of the other servers) |

## Several Writers (content().sync)

Since zation-server 3.0.0-beta.3, several servers can `sync` the same Databox (member); see [Sync the Whole Content](guides/server/databoxes.md#sync-the-whole-content).

### Timestamps

A transaction without a given `timestamp` takes `max(now + lead, floor(newest) + 1) + rank`: `newest` is the newest timestamp the Databox saw on this server (its own transactions, those of other servers, the last transaction data of other servers), `rank` a fraction of a millisecond in 1000 steps from the random origin of the server process. `lead` is how far the clocks of other servers run ahead of this one: a server sends its clock (`Date.now()`) with each transaction to the other servers (third element of the server package) and with its answer to the last transaction data request of a new member (fourth element; older servers ignore both), and the largest lead of the current and the last 30 s counts (per process, up to 60 s). The latency only makes it smaller; timestamps of transactions do not count, since they can run ahead of a clock. A transaction of unknown content (`anyContentChange`) takes `now + lead` without the rank, as it orders nothing. Timestamps of one server only grow; a server whose clock runs behind takes newer ones once it saw a transaction of a server whose clock runs ahead; two servers never take the same one (the same rank of two servers is a chance of one in a thousand). Many transactions in one millisecond move the timestamps ahead of the clock.

### Shadow

Each server keeps, per registered member, the content as its clients hold it: objects key by key with the timestamp of each key, a deleted key keeps its timestamp, every other value whole. It applies its own and the other servers' transactions with the rules of the client. `sync(next)` compares `next` with it and sends updates with `potentialInsert` and deletes, no base (`b`). Without a shadow (first `sync` of the server, after a reload, a reset, a cut subscription or a close) the value goes whole: an update of the head with `potentialInsert`. While the subscription is not active, every `sync` goes whole and no shadow is kept. `sync` on a member without clients registers it (subscription) until `unregisterDelay` after the last `sync`.

A transaction the shadow can not follow (if conditions, queries, a path into a list, unknown content) drops it.

### Conflict

An update with `potentialInsert`, an `insert` with `potentialUpdate` or a `delete` of another server conflicts when it does not take (an older timestamp, a missing parent, a deleted key) and its value differs from the shadow, or when it takes and removes a newer change inside with another value. The source holds the change that was written last; the timestamps can not tell which one that is. The server resets the member (its clients reload, the history takes a position, the last transaction id becomes unknown) and sends a gap notice (`g`): the other servers reset it too.

### Fetch Timestamp

Fetched data takes `max(now + lead, newest)`: never older than a transaction the server saw, and not behind the clocks of the other servers, so a transaction that comes late (a broker connection that was down sends its buffer when it is back) does not override newer data. The newest timestamp of fetched data per member is kept: a transaction of another server that is older than it and still takes in the shadow (the clients that loaded rejected it, the data may not hold it) makes the clients of this server reload. With clocks seconds apart this happens until the server whose clock runs behind saw a transaction of the one that runs ahead.

A new member asks the other servers for the last transaction data once more when its subscription becomes active (answers to the first request, sent before, can be lost). Limit: a server that just started and has not heard the clock of a server that runs seconds ahead (its broker connection is down) can let a transaction of that server, which comes late from its buffer, override newer data on its clients until the next change of the key.

### Compatibility

* Older clients apply the transactions as before (they ignore the fraction).
* The base `b` of `content().sync` transactions (only in unreleased builds before this) is gone from servers and clients.
* Servers without the shadow do not notice conflicts; servers without the clock stamp with their own clock.
* Given `timestamp`s must not run behind the clock of any server: fetched data of a server whose clock runs ahead rejects them until they pass it.

### Cost

| What | Cost |
| --- | --- |
| Memory | about ten times the content as JSON per synced member and server (4.4 KB for 415 bytes with 35 keys) |
| `sync` | about 1 µs with one changed key in an unchanged object tree, about 6 µs for a freshly read value |
| Transaction of another server | about 0.3 µs (one key), 4.5 µs (whole value of that size) |
| Bytes | one changed key about 45 bytes of operations instead of 440 bytes whole; the timestamp fraction four bytes to clients; the clock of the sender 14 bytes per transaction between servers |
| Conflict | one reload per client of the member on every server |
