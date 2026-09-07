# Events & Middlewares

Events and middlewares are defined in the app configuration.
An **event** is a notification: the server does not wait for its execution.
A **middleware** is part of a flow: the flow only continues when the middleware has finished, and flow control middlewares can allow or block an action.

## Events

```typescript
Config.appConfig({
    events: {
        launched: () => {
            bag.log.info('Server is ready');
        },
        socketConnection: (socket) => {},
        socketDisconnection: (socket, code, data) => {},
        error: (error) => {
            bag.log.error('Unknown error', error);
        }
    }
}).register();
```

Every event accepts one function or an array of functions.

| Event | Parameters | Description |
| --- | --- | --- |
| `launched` | | The server has launched successfully. |
| `exit` | | The server is about to exit. |
| `error` | `(error)` | An unknown error was thrown while processing a request, middleware, background task or event. |
| `codeError` | `(codeError)` | A `CodeError` was created (wrong usage of the API). |
| `serverMessage` | `(data)` | A server message sent from the bag was received. |
| `socketConnection` | `(socket)` | A new socket connected. |
| `socketDisconnection` | `(socket, code, data)` | A socket disconnected. |
| `socketAuthentication` | `(socket)` | A socket was authenticated or its token changed. |
| `socketDeauthentication` | `(socket)` | A socket was deauthenticated. |
| `socketBadAuthToken` | `(socket, error, signedToken)` | A client tried to authenticate with an invalid or expired token. |
| `coreServerError` | `(error, server)` | An error occurred on the core server (advanced). |
| `coreSocketError` | `(error, socket)` | An error occurred on a core socket (advanced). |

### Prepare with `$init`

To prepare values once instead of on every invocation, wrap the function with `$init`. The init function receives the bag and returns the actual event function:

```typescript
events: {
    socketConnection: $init(bag => {
        const serverInfo = `${bag.serverId} (${bag.serverUrl})`;
        return socket => {
            bag.log.info(`New socket (${socket.id}) connected on server: ${serverInfo}.`);
        }
    })
}
```

## Middlewares

```typescript
Config.appConfig({
    middlewares: {
        socket: (socket) => {
            if(socket.handshakeAttachment?.oldClient) return false;
        },
        authenticate: async (token) => {
            if(await isRevoked(token.tid)) return false;
        },
        init: async () => {
            await warmUpCaches();
        },
        cleanup: async () => {
            await db.close();
        }
    }
}).register();
```

### Flow Control Middlewares

These middlewares decide whether an action is allowed. Multiple functions are chained in the defined order:

* return nothing: the next function is called; when no function remains, the action is allowed (except `panelAuth`, where it is blocked).
* return `true`: the action is allowed immediately.
* return `false`, return a `Block` instance or throw a `Block`: the action is blocked.

| Middleware | Parameters | Description |
| --- | --- | --- |
| `socket` | `(socket)` | Block sockets before they are fully connected. |
| `authenticate` | `(token)` | Block JSON web tokens, e.g. revoked tokens. |
| `panelAuth` | `(username, password)` | Allow panel logins that are not defined in the server config. |

A `Block` can carry a code and a message that are sent to the client:

```typescript
import {Block} from "zation-server";

socket: (socket) => {
    if(isBanned(socket.remoteAddress)) throw new Block(4503, 'banned');
    if(maintenance) throw new Block(4403, 'maintenance');
}
```

The default block code is `4503`. Codes from `4500` upwards are permanent: the client does not try to reconnect automatically. Use a code below `4500` (e.g. `4403`) for temporary blocks, then the client keeps reconnecting with backoff.

### Standard Middlewares

| Middleware | Parameters | Description |
| --- | --- | --- |
| `init` | | Initialize additional things at startup. |
| `beforeComponentsInit` | | Runs before the components are initialized. |
| `afterComponentsInit` | | Runs after the components are initialized. |
| `coreServerInit` | `(server)` | Initialize the core ziron server (advanced). |
| `socketInit` | `(socket)` | Initialize extra things when a socket is created (advanced). |
| `cleanup` | | Clean up resources before the server exits. |
| `httpRequest` | `(req, res)` | Handle custom HTTP requests that are not handled internally. When the response is not ended, a `426 Upgrade Required` is sent. |

### Serving Static Files

The `httpRequest` middleware together with the `StaticFilesRouter` can serve a website from the same server:

```typescript
import {StaticFilesRouter} from "zation-server";

const staticFiles = new StaticFilesRouter();
staticFiles.folder('public', '/');

middlewares: {
    httpRequest: (req, res) => staticFiles.handle(req, res)
}
```
