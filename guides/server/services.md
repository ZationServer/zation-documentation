# Services

A service represents something that needs to be created before the server starts and is used later in your components, for example a database connection, a mail transport or an API client.
Services are defined in the services configuration and accessed through the bag or injected with a decorator.

## Define a Service

```typescript
import {Config} from "zation-server";
import {createPool, Pool} from "mysql2/promise";

Config.servicesConfig({
    mysql: {
        create: async (config, instanceName) => {
            return createPool(config);
        },
        get: async (pool: Pool) => {
            return pool;
        },
        instances: {
            default: {
                host: process.env.DB_HOST,
                database: 'myDb',
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD
            },
            analytics: {
                host: process.env.ANALYTICS_DB_HOST,
                database: 'analytics',
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD
            }
        }
    }
}).register();
```

| Property | Description |
| --- | --- |
| `create(config, instanceName)` | Creates the service instance from the instance configuration. Called once per instance at server start. |
| `get(instance)` | Optional. Returns what `bag.getService` should resolve, e.g. a connection from a pool. |
| `instances` | Named configurations. The instance `default` is used when no instance name is given. |

If the creation of a service fails, the server does not start.

## Service Packages

Reusable service packages are built with the `zation-service` API, for example `zation-service-mysql` or `zation-service-nodemailer`.
They are spread into the services config:

```typescript
import {Config} from "zation-server";
import {MySqlService} from "zation-service-mysql";

Config.servicesConfig({
    ...MySqlService({
        default: {
            host: 'localhost',
            database: 'myDb',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        }
    })
}).register();
```

## Use a Service

```typescript
const pool = await bag.getService<Pool>('mysql');
const analytics = await bag.getService<Pool>('mysql', 'analytics');
bag.hasService('mysql', 'analytics');
```

`getService` throws a `ServiceNotFoundError` when the service or the instance does not exist.

Inside components, services can be injected:

```typescript
export default class GetUser extends Controller {

    @Inject.Service('mysql')
    private readonly db: Pool;

    async handle(socket: Socket, {id}) {
        const [rows] = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }

}
```
