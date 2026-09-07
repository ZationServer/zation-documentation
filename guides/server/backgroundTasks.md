# Background Tasks

Background tasks are functions that run at a specific time or in an interval, for example to clean up expired sessions or to aggregate statistics.
They are defined in the app configuration.

```typescript
Config.appConfig({
    backgroundTasks: {
        cleanUpSessions: {
            every: 60000,
            task: async () => {
                await db.sessions.deleteExpired();
            }
        },
        dailyReport: {
            every: {hour: 2, minute: 0},
            task: async () => {
                await sendReport();
            }
        },
        warmUp: {
            at: 5000,
            task: () => {
                bag.log.info('Warm up done');
            }
        }
    }
}).register();
```

| Option | Description |
| --- | --- |
| `every` | Run repeatedly: a number of milliseconds or a time object (`{hour, minute, second, millisecond}`). Arrays define multiple times. |
| `at` | Run once: a number of milliseconds after start or a time object. |
| `task` | The function or an array of functions. |
| `clusterSafe` | Default `true`: only one server in the cluster runs the task. Set it to `false` to run it on every server. |

Time objects use the `timeZone` of the server config. Missing parts of a time object are treated as wildcards, e.g. `{minute: 30}` runs every hour at minute 30.

Errors thrown inside a task trigger the `error` event and do not crash the server.
