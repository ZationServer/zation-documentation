# Configurations

Zation is configured with three configuration objects: the server config, the app config and the services config.
They are registered with the static `Config` class and are typically located in the `configs` folder.

```typescript
import {Config} from "zation-server";

Config.serverConfig({
    port: 3000,
    debug: false,
    panel: {
        active: true,
        user: {username: 'admin', password: 'admin'}
    },
}).register();
```

The `register` method registers the configuration. 
If a configuration of the same type was already registered, a `ConfigBuildError` is thrown. 
You can pass `true` to merge the new configuration into the already registered one (existing primitive properties are overridden and new properties are added).
That is useful in tests to override the port or hostname:

```typescript
Config.serverConfig({
    port: 3008,
    hostname: 'localhost',
    origins: '*:*'
}).register(true);
```

All registered configurations are available via `Config.configurations` and are passed to the `launch` function automatically.

## Server Config

The server config describes the technical settings of the server instance. Every property is optional.

| Property | Default | Description |
| --- | --- | --- |
| `id` | random | Unique id of the instance in a cluster. |
| `port` | `3000` | Port where the server listens. |
| `hostname` | `'localhost'` | Hostname of the server. |
| `path` | `''` | URL path of the server. |
| `license` | Free Trial | Your Zation license key. Required for public or commercial usage. |
| `origins` | `null` (all) | Allowed origins, e.g. `'example.de:*'` or `['example.de','api.example.de:443']`. |
| `tags` | | Meta information displayed in the panel, e.g. `[['region','eu']]` or `'region:eu,canary'`. |
| `debug` | `false` | Console logs about the status and actions of connected clients (disabled in production mode). |
| `launchDebug` | `false` | Logs all launch steps and their duration (disabled in production mode). |
| `showConfigWarnings` | `true` | Log config warnings after the config check. |
| `checkConfigs` | `true` | Check the configurations on start. Do not disable it in development. |
| `timeZone` | guessed | Time zone used to calculate background task times. |
| `tls` | `null` | TLS options (`key`, `cert`, ...) to enable encrypted connections. |
| `sendErrorDescription` | `false` | Send error descriptions back to the client. |
| `defaultClientApiLevel` | `1` | API level used when the client does not provide one. |
| `panel` | `{active: false}` | Panel options, see [Panel](guides/server/panel.md). |
| `auth` | see below | Options to sign and verify the JSON web tokens. |
| `compression` | active | permessage-deflate options. |
| `validationCheckLimit` | `5` | Max checks in one validation request. |
| `socketDataboxLimit` | `30` | Max Databoxes a socket can connect to. |
| `socketChannelLimit` | `30` | Max Channels a socket can subscribe to. |
| `variables` | | Custom variables accessible with `bag.getServerConfigVariables()`. |
| `log` | | Logging options (console, file, panel). |
| `logComponentApi` | `true` | Log the complete component API at start. |
| `responseTimeout` | `7000` | Default timeout in ms for the response of an invoke. |
| `pingInterval` | `8000` | Interval in ms in which the server pings the clients. |
| `maxPayloadSize` | `4194304` | Maximum message size in bytes. |
| `maxBackpressure` | `6291456` | Maximum send backpressure per socket in bytes. |
| `join` | `null` | Join token to join a cluster, see [Scaling Horizontally](guides/server/scalingHorizontally.md). |
| `clusterShareTokenAuth` | `true` | Share the auth options in the cluster. |

### Auth Options

```typescript
auth: {
    algorithm: 'HS256',
    secretKey: process.env.AUTH_SECRET,
    defaultExpiry: 86400,
    tokenVersion: 1
}
```

By default, a random secret key is generated on every start, which invalidates all tokens after a restart. 
In production, always provide a fixed `secretKey` or a `privateKey`/`publicKey` pair (for RSA or ECDSA algorithms). 
Increase the `tokenVersion` to invalidate all existing tokens.

### Log Options

```typescript
log: {
    console: {active: true, logLevel: 5},
    file: {
        active: true,
        logLevel: 4,
        filePath: 'logs/server.log',
        download: {active: true, accessKey: process.env.LOG_KEY}
    },
    panel: {active: true, logLevel: 5}
}
```

The log levels are: `6` debug, `5` info/busy, `4` warn, `3` error, `2` failed/fatal, `1` active, `0` nothing.
When file logging with download is active, the log file can be downloaded at `http://host:port/log/<accessKey>`.

## App Config

The app config defines your application:

```typescript
import {Config, $init} from "zation-server";

import "../app";

Config.appConfig({
    appName: 'MyApp',
    userGroups: {
        auth: {
            admin: {},
            user: {},
        },
        default: 'guest',
    },
    controllerDefaults: {
        access: 'all',
    },
    events: {
        socketConnection: $init(bag => {
            const serverInfo = `${bag.serverId} (${bag.serverUrl})`;
            return socket => {
                bag.log.info(`New socket (${socket.id}) connected on server: ${serverInfo}.`);
            }
        }),
    },
}).register();
```

| Property | Description |
| --- | --- |
| `appName` | The name of the app. |
| `userGroups` | The user groups, see [User Groups](guides/server/userGroups.md). |
| `events` | React to server events, see [Events & Middlewares](guides/server/events.md). |
| `middlewares` | Influence flows, see [Events & Middlewares](guides/server/events.md). |
| `controllers`, `receivers`, `databoxes`, `channels` | Register components by identifier. Usually you use the `@Register` decorator or a `Router` instead. |
| `controllerDefaults`, `receiverDefaults`, `databoxDefaults`, `channelDefaults` | Default configurations used as a fallback for each component type. |
| `backgroundTasks` | Scheduled tasks, see [Background Tasks](guides/server/backgroundTasks.md). |
| `allowedSystems` | Allowed client systems and versions, e.g. `{IOS: 1.0, WEB: 'any'}`. |
| `healthCheck` | Custom health check function(s) used by the `/health` endpoint. |

?> Only components registered to the **primary** app config are used. If you split the app config into multiple files, only one of them should be registered as primary (`Config.appConfig(config, false)` for the others).

## Services Config

The services config defines services that are created before the server starts, for example database connections.
See [Services](guides/server/services.md).

## Accessing the Configurations

The configurations can be accessed at runtime via the [Bag](guides/server/basicsBags.md):

```typescript
bag.serverConfig.port;
bag.appConfig.appName;
bag.getServerConfigVariables<{myVar: string}>().myVar;
```
