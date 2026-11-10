# React

The `zation-react-toolkit` package provides hooks for the client in React components.

```bash
npm install zation-react-toolkit
```

Without a client, the hooks use the primary client.

| Hook | Returns |
| --- | --- |
| `useClient()` | The primary client. |
| `useDatabox(client?, identifier, member?, options?)` | The connected Databox, with `withTracking()` and `withSelector(selector, isEqual?)`. `options.enabled: false` does not connect it. |
| `useDataboxTracking(databox)` | The data; re-renders on every change. |
| `useDataboxSelector(databox, selector, isEqual?)` | The selected part; re-renders only when it changes. |
| `useConnected(client?)` | Whether the client is connected. |
| `useAuthenticated(client?)` | Whether the client is authenticated. |
| `useAuthTokenPayload(client?)` | The token payload, `null` without a token; re-renders with each new token. |
| `useRequest(request, isEnabled?)` | `{data, error, reload}` of a request. |

## Databoxes

`useDatabox` connects the Databox while the component is mounted. Components with the same client, identifier, member and options share one Databox and its connection. After the last of them unmounts, it stays connected for 3 s: a route change or the strict mode of React mounts it again without a new connect.

```typescript
const [volume] = useDatabox('cinema').withSelector((data) => data?.volume);
const [active] = useDatabox('devices').withSelector((data) => (data ?? []).filter((one) => one.active), shallowEqual);
const [room] = useDatabox('room', roomId).withTracking();
```

Since every changed part of the data is a new object, the default comparison of a selector by reference is enough. A selector that builds a new array or object needs an equality function such as `shallowEqual`. See [Databoxes](guides/client/databoxes.md#react).

A hook can not be called conditionally. For data that is only wanted after a login or while a part is open, `enabled: false` keeps the component from connecting the Databox; switching it to `true` connects it. The data is the one of the shared Databox, so it is `undefined` unless another component connected it. `enabled` is not part of the options the components share by.

```ts
const [identity] = useDatabox('identity', undefined, {enabled: loggedIn}).withTracking();
```

## Connection and Authentication

```typescript
const connected = useConnected();
const authenticated = useAuthenticated();
const payload = useAuthTokenPayload();
```

`useConnected` re-renders on connect and disconnect, `useAuthenticated` and `useAuthTokenPayload` on authenticate and deauthenticate. Reconnecting stays with the client, see [Events](guides/client/events.md).

## Requests

`useRequest` sends a request when the component mounts and again with `reload`. It is for answers that no Databox holds and that should not be asked on every render.

```typescript
const {data, error, reload} = useRequest(() => client.request('device/ports'), dialogOpen);
```

* While `isEnabled` is `false`, the request waits and goes out when it becomes `true`.
* `data` stays until the next request succeeds; `error` holds the error of the last request.
* The answer of an older request or after the unmount is dropped.
