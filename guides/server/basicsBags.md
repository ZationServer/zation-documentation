# Bag

The `Bag` is the central toolbox of the framework.
It provides access to the configurations, server information, all connected sockets, services, logging, cryptographic tools and more.
There is exactly one Bag instance per server.

## Access the Bag

The bag can be imported from the `zation-server` package:

```typescript
import {bag} from "zation-server";
```

The imported variable is only usable after the server is initialized. 
It is safe to use it inside components, events, middlewares, background tasks and initializers.
If you need the bag at module level, you can wait for it:

```typescript
await Bag.ready();
```

## Server Information

```typescript
bag.serverId;          // id of this server instance
bag.appName;
bag.serverHostname;
bag.serverPort;
bag.serverPath;
bag.serverUrl;         // e.g. http://localhost:3000
bag.secure;            // TLS active
bag.serverVersion;     // version of zation-server
bag.serverState;       // {development, production, test}
bag.launchTimestamp;
bag.clusterLinked;     // true when joined to a cluster
bag.clusterLeader;     // true when this server is the cluster leader
bag.license;
```

## Configurations

```typescript
bag.serverConfig;
bag.appConfig;
bag.servicesConfig;
bag.getServerConfigVariables<{apiKey: string}>();
```

## Logging

The `log` property provides a logger that writes to the console, the log file and the panel depending on the log options:

```typescript
bag.log.info('Server started');
bag.log.warn('Something looks odd', details);
bag.log.error('Failed to process', err);
bag.log(true).info('Logged globally (local + panel)');
```

Available methods: `debug`, `launchDebug`, `info`, `success`, `busy`, `warn`, `error`, `failed`, `fatal`, `active` and `custom(category, ...args)`.

## Sockets

```typescript
bag.sockets;                        // all connected sockets of this server
bag.clientsCount;
bag.getSocket(id);
bag.getSocketsWithUserId(userId);
bag.getSocketsWithTokenId(tokenId);
bag.getAuthUserGroupSockets('admin');
bag.getDefaultUserGroupSockets();
bag.getAuthUserGroupsCounts();      // {admin: 2, user: 40}
```

## Services

```typescript
const db = await bag.getService('mysql');           // default instance
const second = await bag.getService('mysql', 'secondDb');
bag.hasService('mysql');
```

See [Services](guides/server/services.md).

## Components

Component instances can be resolved with `get`:

```typescript
const chatChannel = bag.get(ChatChannel);
const profileDbs = bag.get(ProfileDatabox_1, ProfileDatabox_2); // container for multiple API levels
const manager = bag.get(NavigatorManager);                     // singleton
```

## Utilities

```typescript
await bag.wait(1000);
bag.generateRandomString(16);
bag.generateUUIDv4();
bag.generateUniqueId();
bag.deepClone(value);
bag.deepEqual(a, b);
bag.deepFreeze(value);
bag.jsonStringifySafe(value);
bag.base64Encode('hello');
await bag.fetch('https://example.com/api'); // HTTP request (node-fetch)
```

More advanced functions are described in the [Advanced Bag](guides/server/advancedBags.md) chapter.
