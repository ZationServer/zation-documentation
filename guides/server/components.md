# Components

A Zation backend is built with four kinds of components:

| Component | Description |
| --- | --- |
| [Controller](guides/server/controller.md) | Handles a request and returns a result (request/response). |
| [Receiver](guides/server/receivers.md) | Handles a package without a response (fire and forget). |
| [Databox](guides/server/databoxes.md) | Provides data to clients and keeps it synchronized in real time. |
| [Channel](guides/server/channels.md) | Publish/subscribe channel to push events to clients. |

Databoxes and Channels exist in two variants: the normal (family) variant where a client connects to a specific **member** (e.g. a chat id) and the **static** variant without members.

Every component is a class that extends the corresponding base class and is configured with a static config.
The recommended way is the `Config` decorator of the base class:

```typescript
import {Controller, Socket} from "zation-server";

@Controller.Config({
    access: 'all',
})
export default class SendMessage extends Controller {

    async handle(socket: Socket, input: any) {
        return 'ok';
    }

}
```

Alternatively, you can define a static `config` property:

```typescript
export class SendMessage extends Controller {
    static config: ControllerConfig = {
        access: 'all'
    };
}
```

## Registering Components

A component is only reachable when it is registered with an endpoint identifier. There are two ways.

### Router

A `Router` groups components under a route. Routers can be nested, and the final identifier is the concatenation of the routes and the endpoint name:

```typescript
import {Router} from "zation-server";
import Login from "./Login";
import Register from "./Register";

export const authRouter = new Router('auth');

authRouter.use(Login);
authRouter.use(Register, {endpointName: 'signUp'});
```

```typescript
const rootRouter = new Router();
rootRouter.use(authRouter);
rootRouter.register();
```

This registers the endpoints `auth/login` and `auth/signUp`.
Only the `register` call of the root router registers all components in the configuration.
Make sure that the file which registers the root router is imported by the app config.

### Register Decorator

Instead of a router, a component can register itself with the `@Register()` decorator.
You only have to import the file in the app config.

```typescript
@Register()
@Controller.Config({access: 'all'})
export class SendMessageController extends Controller {}
```

## Endpoint Names and API Levels

The endpoint name and API level are taken from the `@API` decorator or parsed from the class name:

| Class name | Endpoint name | API level |
| --- | --- | --- |
| `SendMessageController` | `sendMessage` | undefined |
| `RemoveItem` | `removeItem` | undefined |
| `BlockUserController_4` | `blockUser` | 4 |
| `ProfileDatabox_13` | `profile` | 13 |
| `ChatChannel` | `chat` | undefined |
| `MoveReceiver` | `move` | undefined |

The suffixes `Controller`, `Receiver`, `Databox` and `Channel` are removed, the first letter is lower-cased, and an `_<number>` suffix defines the API level.

With the `@API` decorator you define the endpoint name (and optionally the API level) explicitly:

```typescript
@API("get")
@Databox.Config({access: 'allAuth'})
export default class GetProfile extends Databox {}
```

Both `@Register({endpointName, apiLevel})` and `router.use(Component, {endpointName, apiLevel})` can override these values.

### API Levels

API levels allow you to provide multiple versions of the same endpoint.
The client sends its API level in the connection (`apiLevel` client option) or per request.
The server selects the component with the highest API level that is lower than or equal to the client's API level.
Components without an API level are used as a fallback.
When the client does not send an API level, the `defaultClientApiLevel` of the server config is used.

```typescript
@Register()
export class ApiLevelController_2 extends Controller {
    async handle() { return 'v2'; }
}

@Register()
export class ApiLevelController_5 extends Controller {
    async handle() { return 'v5'; }
}
```

A client with API level 3 gets `v2`, a client with API level 7 gets `v5`.
Inside a component, `socket.apiLevel` and `packet.apiLevel` give you the API level of the request.

## Lifecycle

Components are instantiated once when the server starts. 
Injections (`@Inject`) are processed first, then all `@Initializer` methods, then the `initialize` method of each component is called.
See [Singletons & Injection](guides/server/singletons.md).

The component instance is shared between all requests, so do not store request-specific state in instance properties.
