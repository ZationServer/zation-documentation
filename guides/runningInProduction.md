# Running in Production

This chapter summarizes what to check before running a Zation server on a public server.

## Checklist

* Start the server in **production mode** (`MODE=p`). Debug logging is disabled, and the config check is faster.
* Provide a **license** (`license` option or `ZATION_LICENSE` env) - a valid license is required for public or commercial use. Without one the server starts but logs a warning at every start.
* Set a fixed **auth secret** (`auth.secretKey` or a key pair) so that tokens survive restarts and are valid on every instance.
* Restrict the allowed **origins** to your domains.
* Enable **TLS** (`tls` option) or terminate TLS at a reverse proxy / load balancer.
* Set strong **panel passwords** or deactivate the panel.
* Configure **file logging** with a secret download key or disable the download.
* Run `npm run check` in your CI pipeline to validate configurations and components.
* Use the **health endpoint** for container and load balancer health checks.

## Example Server Config

```typescript
import {Config} from "zation-server";

Config.serverConfig({
    id: process.env.SERVER_ID,
    port: parseInt(process.env.PORT || '3000'),
    hostname: process.env.HOSTNAME || '0.0.0.0',
    path: process.env.SERVER_PATH || '',
    license: process.env.ZATION_LICENSE,
    origins: ['app.example.com', 'admin.example.com'],
    tags: process.env.SERVER_TAGS,
    debug: false,
    launchDebug: false,
    auth: {
        secretKey: process.env.AUTH_SECRET,
        defaultExpiry: 86400
    },
    panel: {
        active: true,
        user: {username: 'admin', password: process.env.PANEL_PASSWORD}
    },
    log: {
        console: {logLevel: 4},
        file: {
            active: true,
            logLevel: 3,
            filePath: 'logs/server.log',
            download: {active: false}
        }
    },
    join: process.env.JOIN_TOKEN || null
}).register();
```

## Environment Variables

Zation itself reads only the `MODE` variable. All other values are read by your configuration code, so you decide the names.
The state and broker processes read `SECRET`, `JOIN`, `PORT`, `SERVER_PATH` and `LOG_LEVEL`, also from Docker secrets in `/run/secrets`.

## Docker

The CLI generates a multi-stage `Dockerfile`:

```dockerfile
FROM node:20 AS build
WORKDIR /usr/app/
COPY . .
RUN npm ci
RUN npm run build

FROM node:20-slim
WORKDIR /usr/app
ENV MODE=p
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /usr/app/dist ./dist

HEALTHCHECK --interval=15s --timeout=15s --start-period=10s \
   CMD node node_modules/ziron-server/dist/healthcheck.js d-3000

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

The health check script requests `http://localhost:<port><path>/health`. 
The first argument is the port (`d-3000` means "default 3000, overridable with the `PORT` variable"), the optional second argument is the server path (or `SERVER_PATH`).

## Health Endpoint

`GET /health` returns `200 OK` when the server is running and all custom health check functions (`healthCheck` in the app config) return `true`, otherwise `500`.

```typescript
Config.appConfig({
    healthCheck: async () => await db.ping()
}).register();
```

## Reverse Proxy

When running behind NGINX or another proxy, enable WebSocket upgrades:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
}
```

The `pingInterval` (default 8 s) keeps connections alive, so proxy timeouts can stay at their defaults.

## Graceful Shutdown

On `SIGINT`/`SIGTERM` the server runs the `cleanup` middlewares, triggers the `exit` event, waits for promises registered with `bag.exitAwait` and disconnects all clients with code `1001`. 
Clients reconnect automatically, so rolling deployments behind a load balancer work without client changes.

## Scaling

Run multiple instances behind a load balancer and connect them to a cluster, see [Scaling Horizontally](guides/server/scalingHorizontally.md).
One instance uses one CPU core, so run one instance per core.

## Monitoring

* The [Panel](guides/server/panel.md) shows live statistics of all instances.
* `bag.getCpuUsage()`, `bag.getMemoryUsage()` and `bag.clientsCount` can be exported to your monitoring system in a background task.
* Subscribe to the `error` and `coreServerError` events to forward errors to your error tracking.
