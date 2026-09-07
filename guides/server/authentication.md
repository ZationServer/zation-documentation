# Authentication

Zation authenticates clients with signed JSON web tokens (JWT).
A token contains the auth user group, an optional user id, a custom payload and metadata such as the expiry and token id.
The client stores the signed token (by default in the local storage of the browser) and sends it automatically when it reconnects.

## Authenticate a Socket

Authentication is usually done in the [AuthController](guides/server/controller?id=the-authentication-controller), but every component can authenticate a socket:

```typescript
await socket.authenticate('user', user.id, {email: user.email}, {expiresIn: 3600});
```

| Parameter | Description |
| --- | --- |
| `authUserGroup` | Name of an auth user group defined in the app config. |
| `userId` | Optional user id (string or number). |
| `payload` | Optional custom payload stored in the token. |
| `signOptions` | Options of the `jsonwebtoken` package, e.g. `expiresIn`. Defaults to `defaultExpiry` of the auth options. |

To deauthenticate a socket:

```typescript
socket.deauthenticate();
```

## Token Information

```typescript
socket.authenticated;       // boolean
socket.userGroup;           // current group (auth group or default group)
socket.authUserGroup;       // auth group or undefined
socket.userId;              // user id or undefined
socket.authToken;           // readonly token or null
socket.authTokenPayload;    // readonly payload or null
socket.signedAuthToken;     // signed token string or null
```

The `get*` variants (`socket.getUserId()`, `socket.getAuthUserGroup()`, `socket.getAuthTokenPayload()`) throw an `AuthenticationRequiredError` when the socket is not authenticated.

## Change the Token

Every change re-signs the token and sends it to the client:

```typescript
await socket.setUserId(42);
await socket.setAuthTokenPayload({email, role: 'editor'});
await socket.setPanelAccess(true);

// edit single properties of the payload (each assignment is committed directly)
socket.editAuthTokenPayload().role = 'admin';

// or bundle multiple changes into one token update
const edit = socket.editAuthTokenPayload(true);
edit.role = 'admin';
delete edit.tmp;
await edit.commit();
```

The `socketAuthentication` event is triggered on every token change and the `socketDeauthentication` event when the token is removed.

## Token Expiry

The server checks for expired tokens in the interval `auth.expireCheckInterval` (default 12 s) and deauthenticates the socket.
When a client connects with an invalid or expired token, the `socketBadAuthToken` event is triggered, and the client is treated as not authenticated.

## Authentication Middleware

The `authenticate` middleware can block tokens, for example, when the user was deleted or the token was revoked:

```typescript
Config.appConfig({
    middlewares: {
        authenticate: async (token) => {
            if(await isRevoked(token.tid)) return false;
        }
    }
}).register();
```

## Multiple Servers

In a cluster, the auth options of the first server are shared with all other servers (`clusterShareTokenAuth`), so tokens stay valid on every instance.
Cluster-wide deauthentication is available with the bag: `bag.deauthenticateUser(userId)`.

## Client Side

```typescript
await client.authenticate({email, password});   // sends a request to the AuthController
await client.signAuthenticate(signedToken);     // authenticate with an existing signed token
await client.deauthenticate();
client.authenticated;
client.userId;
client.authTokenPayload;
```
