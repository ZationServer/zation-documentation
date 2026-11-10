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
| `r` | `{h?, n?, i}` | Reconnect only, with the token: where the data of the client stands. History id `h` and position `n` it got last from that server, last transaction id `i`. Not sent while a reload runs or after a reload failed. |

### Connect Response

New fields, only when the request has `v`:

| Field | Value | Meaning |
| --- | --- | --- |
| `v` | `1` | Protocol version of the server. |
| `h` | string | Id of the history of the Databox (member) on this server. It is new with every registration. |
| `n` | number | The position in the history that the response brings the client to. |
| `r` | `0`, `1`, `2` or missing | `0` unchanged; `1` the missed transactions are in `tx`; `2` the data is in `f`, followed by the transactions in `tx`. Missing: the client fetches (first contact) or reloads (reconnect) by itself. |
| `f` | `{c, d, t, ti}` | The fetched data like a fetch response: counter, data, new token, timestamp. |
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

A connect request with `v`:

1. Checks access, token and options as before.
2. Finds where the client stands (the base):
    * With the id of this history: the position `n` when every transaction after it is kept and can be replayed. With a transaction middleware only when nothing came after it, because each missed transaction would need the middleware for this socket.
    * With another id (another server, another registration): the newest position when `i` is the last transaction id and no kept entry is a reload. That is the check of version 0.
3. Without a base and with `f`: fetches on a new main session (counter 0) before the socket joins. The base is the position when the fetch started. Errors give no data: the client fetches by itself and gets the error then.
4. Registers the socket. In the same turn, it adds `h`, `n`, `r` and the transactions after the base (`tx`). When the Databox registered again meanwhile, or a transaction after the base can not be replayed, `r` stays empty.
5. Only when the data goes out, the input channel takes the new main session.

Every package after the response has a position above `n`. A package with a position up to `n` that still comes after the response (a bundle of the same turn) is in the response already.

### Client

* Sends `v`, `f` and `r` as described. The connect requests of one microtask round (all Databoxes after a reconnect) go out as one message.
* While its request is on its way, the Databox holds the packages of its output channel (another Databox on the socket may have connected already).
* `r: 0`: nothing to do. `r: 1`: applies `tx` in order, with the base check of `content().sync`. `r: 2`: takes `f` (first contact like a fetch, reconnect like a reload) and applies `tx` on it; a transaction of unknown content in `tx` starts a reload.
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

* **Another server:** the history id differs, so the client resumes only by its last transaction id (unchanged) or gets the data.
* **Expired history:** more transactions than `historyLength`, more than `historySize`, or the Databox unregistered after `unregisterDelay` without clients: the client gets the data.
* **Changes during the resume:** the response covers everything up to `n`, later changes come as packages; nothing is applied twice.
* **Forced reloads:** a client that comes back to the server gets the data. On another server, too, while the reload is in its history. As before, `forceReload` only reaches connected clients for sure; use `anyContentChange` for changes everyone has to get.
* **`content().sync`:** missed synced transactions come in order, so each fits its base.
