# Access Rules

Every component (Controller, Receiver, Databox, Channel) has an `access` option that defines which clients may use it.
If no access rule is defined (neither in the component nor in the defaults), access is denied.

```typescript
@Controller.Config({
    access: 'allAuth'
})
```

## Possible Values

| Rule | Description |
| --- | --- |
| `true` / `'all'` | All clients are allowed. |
| `false` | No client is allowed. |
| `'allAuth'` | Only authenticated clients. |
| `'allNotAuth'` | Only not authenticated clients. |
| `'admin'` | Only clients of the auth user group `admin` (any defined group name, also the default group name). |
| `$userId(10)` | Only the client with user id `10`. Use `$userId(10, false)` to also allow `'10'`. |
| `$tokenPayloadMatches({age: {$gt: 17}})` | The token payload must match the [queric](https://www.npmjs.com/package/queric) query. |
| `$socketAttachmentMatches({...})` | The socket attachment must match the query. |
| `$handshakeAttachmentMatches({...})` | The handshake attachment sent by the client must match the query. |
| `(socket) => boolean` | Custom function (sync or async). Databoxes and Channels additionally receive an info object with the member. |

## Combine Rules

Rules can be combined with `$or`, `$and` and inverted with `$not`. An array is a shortcut for `$or`, a nested array for `$and`:

```typescript
import {$userId, $and, $or, $not, $tokenPayloadMatches} from "zation-server";

access: ['admin', 'user']                       // admin or user
access: $or('admin', $userId(10))               // admin or user id 10
access: [['user', $userId(10)]]                 // user and user id 10
access: $and('user', $userId(10))               // same as above
access: $not(['admin', 'user'])                 // everyone except admin and user
access: ['admin', $and('user', $tokenPayloadMatches({canEdit: true}))]
```

## Custom Functions

```typescript
access: async (socket) => {
    return socket.authenticated && await isNotBanned(socket.userId);
}
```

For Databoxes and Channels the function gets the member information:

```typescript
@Databox.Config({
    access: (socket, {member}) => socket.userId === member
})
```

## Rechecking Access

Databoxes and Channels keep a connection open after the access check. 
Whenever the token of a socket changes, the access of all connections is rechecked automatically.
If an access rule depends on external data (e.g. a database value) that changed, you can force a recheck:

```typescript
await socket.recheckAccess();
await chatChannel.recheckMemberAccess(chatId);
await profileDatabox.recheckMemberAccess(userId);
```

## Defaults

Define fallback rules for each component type in the app config:

```typescript
Config.appConfig({
    controllerDefaults: {access: 'allAuth'},
    receiverDefaults: {access: 'allAuth'},
    databoxDefaults: {access: 'allAuth'},
    channelDefaults: {access: 'allAuth'}
}).register();
```
