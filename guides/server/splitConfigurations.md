# Split Configurations

Large applications can split the configurations into multiple files.

## Merge Configurations

Registering a configuration with `register(true)` merges it into an already registered configuration of the same type:

```typescript
// configs/server.config.ts
Config.serverConfig({port: 3000}).register();

// configs/server.logging.config.ts
Config.serverConfig({
    log: {file: {active: true, filePath: 'logs/server.log'}}
}).register(true);
```

Alternatively, merge configuration objects before registering them:

```typescript
const events = Config.appConfig({events: {...}}, false);
const tasks = Config.appConfig({backgroundTasks: {...}}, false);

Config.appConfig(Config.merge(events, tasks, {
    appName: 'MyApp'
})).register();
```

## Primary App Config

Only components registered to the **primary** app config are added to the server.
When multiple app configs exist, pass `false` as the second parameter for all non-primary configs:

```typescript
Config.appConfig({events: {...}}, false).register(true);
```

## Environment-Specific Configuration

Use environment variables for values that differ between environments:

```typescript
Config.serverConfig({
    port: parseInt(process.env.PORT || '3000'),
    hostname: process.env.HOSTNAME || 'localhost',
    origins: process.env.ORIGINS?.split(',') || null,
    license: process.env.ZATION_LICENSE,
    auth: {secretKey: process.env.AUTH_SECRET},
    join: process.env.JOIN_TOKEN || null
}).register();
```

## Tests

Tests can override the registered configuration before launching the server in test mode:

```typescript
Config.serverConfig({
    port: 3008,
    hostname: 'localhost',
    origins: '*:*'
}).register(true);

await launch(Config.configurations, LaunchMode.Test);
```
