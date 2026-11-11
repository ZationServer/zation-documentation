# Basics

The `zation-client` package is the TypeScript/JavaScript client of the Zation framework.
It works in the browser and in Node.js and communicates with the server over WebSockets.

```bash
npm i zation-client
```

## Create a Client

```typescript
import {Client} from "zation-client";

const client = Client.create({
    hostname: 'localhost',
    port: 3000,
    secure: false
});

await client.connect();
```

Alternatively, pass a URL: `Client.create('wss://api.example.com:443/path', {...})`.

In the browser, the hostname, port and protocol default to the values of the current page URL, so a website served by the same server can use `Client.create()` without options.

### Primary Client

The first client created with `primary = true` (`Client.create(options, true)`) becomes the primary client. 
It can be imported anywhere and stores its token in the local storage under the key `primary`:

```typescript
import {client} from "zation-client";

await client.request('profile/get');
```

`setPrimaryClient(client)` and `clearPrimaryClient()` change the primary client manually.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `hostname` | page host / `localhost` | Hostname of the server. |
| `port` | page port / 80 / 443 | Port of the server. |
| `secure` | page protocol | Use TLS (`wss`). |
| `path` | `'/'` | Path of the server. |
| `autoReconnect` | active | Reconnect options: `active`, `initialDelay` (5000), `multiplier` (1.5), `randomness` (5000), `maxDelay` (60000), `delays` (fixed delays instead), `afterNormalClose` (`false`), `resumeRandomness` (500), see [Reconnect](#reconnect). |
| `rejectUnauthorized` | `false` | Reject self-signed certificates (Node.js). |
| `debug` | `false` | Log status information and errors. |
| `system` | `'Default'` | Name of the client system (e.g. `ios`, `web`), checked against `allowedSystems`. |
| `version` | `1.0` | Version of the client app. |
| `apiLevel` | | Connection API level, see [Components](guides/server/components?id=api-levels). |
| `connectTimeout` | `20000` | Timeout for the connect. |
| `sendTimeout` | `3000` | Time a package may wait in the buffer while not connected before it is rejected (`null` = wait forever). |
| `responseTimeout` | `7000` | Timeout for a response. |
| `handshakeAttachment` | | Custom data sent with the handshake, accessible with `socket.handshakeAttachment` on the server. |
| `tokenStore` | local storage (primary client) | Store for the signed token. Implement the `TokenStore` interface for custom storages. |

## Connection

```typescript
await client.connect();          // resolves when connected (rejects with ConnectAbortError / TimeoutError)
client.connected;
client.disconnect();
await client.reconnect();
await client.ping();             // round trip time in ms
```

Packages sent while the client is disconnected are buffered and flushed after the connection is established (see `sendTimeout` and `maxPackageBufferSize`). A request or transmit while disconnected also starts a connect at once.

## Reconnect

The client reconnects automatically after a connection loss. It does not reconnect:

* after `disconnect()` (whatever the code), until `connect()` is called again or a request or transmit is sent,
* after a code from `4500` upwards (permanent disconnects, e.g. a block by the socket middleware),
* after a normal close of the server (code `1000`, e.g. `socket.disconnect()` on the server or a proxy), unless `afterNormalClose` is `true`.

A server that shuts down (`SIGTERM`) closes with `1001`, so the client reconnects to it after a restart or to another instance.

By default, the first attempt comes after 7.5 to 15 s (`initialDelay` plus up to `randomness`, times `multiplier`), each next one `multiplier` times later, up to `maxDelay`. The randomness spreads the reconnects of many clients after a restart. A ping timeout or a close without status reconnects at once. `delays` sets fixed delays instead, one per attempt in a row, the last one repeats (still up to `maxDelay`):

```typescript
const client = Client.create({
    autoReconnect: {delays: [1000, 2000, 3000, 5000], afterNormalClose: true}
});
```

`client.nextReconnectAt` is the time (`Date.now()`) of the next attempt while one is planned, otherwise `null` (connected, connecting, after `disconnect()`, after a permanent disconnect). `onNextReconnectChange` tells each change in order, the last value a listener gets is the current one (also when a listener calls `reconnectNow()`), e.g. for a countdown:

```typescript
let ticker;
client.onNextReconnectChange((at) => {
    clearInterval(ticker);
    const show = () => label.textContent = at === null ? '' :
        `Next try in ${Math.max(0, Math.ceil((at - Date.now()) / 1000))} s`;
    show();
    if(at !== null) ticker = setInterval(show, 1000);
});
```

### When the App Comes Back

Timers can stand still while a device sleeps (e.g. an iOS web app from the home screen): the connection is dead, and the planned attempt would come late. `client.reconnectNow()` brings a planned reconnect forward to now. Before, it drops an open connection whose ping timeout, or a connect whose connect timeout, has passed by the wall clock; such a connection then reconnects at once. While the connection is fine or no reconnect is planned, nothing happens.

In browsers (also the renderer of Electron), the client calls `reconnectNow(true)` by itself when the page becomes visible (`visibilitychange`), the network comes back (`online`) or the page is shown again (`pageshow`). It only looks for these events and works without them. Other environments call it themselves:

```typescript
// Electron (main process)
import {powerMonitor} from 'electron';
powerMonitor.on('resume', () => client.reconnectNow(true));

// React Native
import {AppState} from 'react-native';
AppState.addEventListener('change', (state) => {
    if(state === 'active') client.reconnectNow(true);
});
```

Many clients can get such an event at the same moment, e.g. when the network of a site with many devices comes back. With `true`, the attempt comes after a random delay of up to `autoReconnect.resumeRandomness` (default 500 ms), so they do not all come back in the same moment; `0` turns it off. Without `true`, e.g. for a button of the user, the attempt comes at once.

In Node.js without such an event, the client reconnects by its delays.

## Authentication

```typescript
await client.authenticate({email, password});   // request to the AuthController
await client.signAuthenticate(signedToken);     // authenticate with an existing token
await client.deauthenticate();

client.authenticated;
client.userId;
client.authUserGroup;
client.authTokenPayload;
client.signedAuthToken;
```

`authenticate` rejects with an `AuthenticationFailedError` when the server did not authenticate the socket (e.g. wrong credentials). The response with the errors is available on the error object.

The token is stored in the token store and sent automatically on every (re)connect, so the client stays authenticated after a page reload.

## Errors

Client methods reject with typed errors, for example `TimeoutError`, `ConnectAbortError`, `CancellationError`, `AuthenticationRequiredError` or a `Response` with back errors for controller requests.

## Next Steps

* [Controller requests](guides/client/controller.md)
* [Receivers](guides/client/receivers.md)
* [Databoxes](guides/client/databoxes.md)
* [Channels](guides/client/channels.md)
* [Events](guides/client/events.md)
* [API Definition](guides/client/apiDefinition.md) for a fully typed client
