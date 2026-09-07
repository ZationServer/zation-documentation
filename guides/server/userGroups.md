# User Groups

The Zation framework uses user groups to define access rights. 
The user groups are split into two types: the authentication groups and the default group. 
The default group is used when the client is not authenticated, so the client is like a guest.
When a client is authenticated, the client gets a signed JSON web token. 
This token is like an id card and contains the authenticated user group, an optional user id and a custom payload.
That means that an authenticated client belongs to an authentication user group and no longer to the default group.
You can only have one default group but multiple authentication groups.

## Declare

The user groups are defined in the app configuration:

```typescript
Config.appConfig({
    userGroups: {
        auth: {
            admin: {
                panelDisplayName: 'Administrator'
            },
            user: {},
        },
        default: 'guest'
    }
}).register();
```

The name of the default user group is set with the property `default`.
Your authentication user groups are defined in the property `auth`.
Every user group name must be unique.
The value of an authentication user group is an object with optional advanced options:

| Option | Description |
| --- | --- |
| `panelDisplayName` | The name of the group displayed in the panel. |
| `panelAccess` | If `true`, members of this group automatically have access to the panel. |

!> **Warning !** You can't use the reserved keywords `all`, `allAuth` and `allNotAuth` as a user group name.

## Usage

The user groups are used in the access rules of components, see [Access Rules](guides/server/accessRules.md).
A client is moved into an authentication group with `socket.authenticate('user')`, see [Authentication](guides/server/authentication.md).

```typescript
socket.userGroup;         // current user group of the socket (default group when not authenticated)
socket.authUserGroup;     // auth user group or undefined
bag.authUserGroupNames;   // all defined auth user group names
bag.defaultUserGroupName; // name of the default user group
```
