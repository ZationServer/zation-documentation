# Singletons & Injection

Zation manages the instances of components and singletons and can inject them into properties.

## Inject

The `@Inject` property decorator injects Databoxes, Channels, singletons or custom values. 
Injections are processed before the components are initialized.

```typescript
import {Inject, Controller, DataboxContainer} from "zation-server";

export default class SendMessage extends Controller {

    @Inject(ChatChannel)
    private readonly chatChannel: ChatChannel;

    @Inject(ProfileDatabox_1, ProfileDatabox_3)
    private readonly profileDb: DataboxContainer;   // multiple API levels combined in a container

    @Inject(NavigatorManager)
    private readonly navigator: NavigatorManager;   // singleton

    @Inject(async () => loadConfig())
    private readonly config: AppConfig;             // raw awaited value

    @Inject.Service('mysql')
    private readonly db: Pool;                      // service instance

}
```

When circular imports cause a class to be `undefined` at import time, pass an arrow function that returns the class: `@Inject(() => ChatChannel)`.

## Singleton

The `@Singleton` class decorator marks a class as a singleton. Zation creates the instance and provides it via `bag.get(Class)` or `@Inject(Class)`.
The constructor must not take arguments.

```typescript
import {Singleton, Initializer, Inject} from "zation-server";

@Singleton
export class NavigatorManager {

    @Inject(ProfileDatabox)
    private readonly profileDb: ProfileDatabox;

    private routes: Map<string, string>;

    @Initializer
    async init() {
        this.routes = await loadRoutes(); // this refers to the singleton instance
    }

    resolve(path: string) {
        return this.routes.get(path);
    }

}
```

## Initializer

The `@Initializer` method decorator marks a method that runs before the components are initialized but after the injections were processed.
Static initializers do not have a `this` context. A non-static initializer on a singleton is bound to the singleton instance, which allows async initialization.

```typescript
export default class Products extends StaticDatabox {

    private static cache: ProductCache;

    @Initializer
    static async prepare() {
        Products.cache = await ProductCache.load();
    }

}
```

## Startup Order

1. Configurations are checked.
2. Services are created.
3. `init` middleware.
4. Singletons are created and injections are processed.
5. Initializers run.
6. `beforeComponentsInit` middleware, `initialize` of every component, `afterComponentsInit` middleware.
7. The server starts listening; the `launched` event is triggered.
