# Testing

The `zation-assured` package provides a fluent API to test a Zation server with real client connections.
The CLI project template already contains a `test` folder with mocha and `zation-assured` configured.

## Setup

```typescript
import launch, {LaunchMode, Config} from "zation-server";
import {when, assert, Client, AUTH_CONTROLLER} from "zation-assured";

import "../src/configs";

const TEST_PORT = 3008;

const client = Client.create({port: TEST_PORT});

before(async () => {
    Config.serverConfig({
        port: TEST_PORT,
        hostname: 'localhost',
        origins: '*:*',
        debug: false
    }).register(true);
    await launch(Config.configurations, LaunchMode.Test);
    await client.connect();
});

after(() => client.disconnect());
```

The test mode (`LaunchMode.Test`) launches the server inside the test process.

## Requests

```typescript
describe('Login', () => {
    when(client, 'Should be able to authenticate')
        .request(AUTH_CONTROLLER, {email: 'test@example.com', password: 'secret'})
        .assertThat
        .isSuccessful()
        .client()
            .isAuthenticated()
            .hasAuthUserGroup('user')
            .hasUserId(10)
            .end()
        .test();

    when(client, 'Should fail with invalid input')
        .request(AUTH_CONTROLLER, {email: 'notvalid'})
        .assertThat
        .isNotSuccessful()
        .hasError()
            .preset()
            .valueNotMatchesWithType()
            .atPath('email')
            .end()
        .hasError()
            .preset()
            .missingObjectProperty()
            .withInfo({propertyName: 'password'})
            .end()
        .test();
});
```

## Receivers, Channels and Databoxes

```typescript
when(client, 'Should receive the publish')
    .transmit('publishMessage', {chatId: '1', content: 'Hello!'})
    .assertThat
    .client()
        .channel('chat', '1')
            .getsPublish('message')
                .withData().equal('Hello!').end()
                .end()
            .end()
        .end()
    .test();

assert.client(client, 'Should get a user profile')
    .databox('profile/get', '1')
        .data()
            .deepEqual({id: '1', name: 'Luca'})
            .end()
        .end()
    .test();
```

Every `when(...)` call defines a mocha `it` test; `assert.value(value)` gives you plain assertions inside custom tests.

## Run

```bash
npm test
```
