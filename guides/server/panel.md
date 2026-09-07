# Panel

The panel is a web application hosted by the server that shows the state of your servers in real time: connected clients, user groups, CPU and memory usage, logs, tags and the registered components.
It also works in cluster mode and shows all servers.

## Activate

```typescript
Config.serverConfig({
    panel: {
        active: true,
        user: [
            {username: 'admin', password: process.env.PANEL_PASSWORD},
            {username: 'ops', password: process.env.OPS_PASSWORD}
        ]
    }
}).register();
```

The panel is available at `http://<hostname>:<port>/panel` (or `https` with TLS).

## Dynamic Users

To authenticate panel users from a database, use the `panelAuth` middleware. It is only called when the credentials do not match a user of the server config:

```typescript
middlewares: {
    panelAuth: async (username, password) => {
        return await isPanelAdmin(username, password);
    }
}
```

Members of an auth user group can be granted panel access automatically with the `panelAccess` option of the user group, or per socket with `socket.setPanelAccess(true)`.

## Panel Logging

Log messages are sent to the panel when panel logging is active (`log.panel.active`, default `true`) and the message is logged globally:

```typescript
bag.log(true).info('Visible in console and panel');
```

Set `log.defaultGlobal: true` to log every message globally by default.

## Display Names and Tags

```typescript
userGroups: {
    auth: {
        admin: {panelDisplayName: 'Administrator'}
    }
}
```

Tags of the server config (`tags: 'region:eu,canary'`) are displayed for every server instance.

!> The panel exposes internal information about your server. Use strong passwords and consider restricting access with the `origins` option or a reverse proxy.
