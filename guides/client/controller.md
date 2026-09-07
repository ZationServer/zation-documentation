# Controller

Controllers are called with the `request` method. The identifier is the endpoint identifier defined on the server (e.g. `auth/login` or `sendMessage`).

```typescript
const message = await client.request('chat/sendMessage', {
    chatId: '1',
    text: 'Hello!'
});
```

The promise resolves with the result of the controller. 
When the controller responded with errors (invalid input, access denied, thrown `BackError`), the promise rejects with a `Response` object.

## Response

Pass `unwrapResult: false` to always receive the `Response`:

```typescript
const response = await client.request('chat/sendMessage', data, {unwrapResult: false});

if(response.successful) {
    console.log(response.result);
}
else {
    console.log(response.errors);                          // BackError[]
    response.filter({name: 'emailAlreadyExists'});         // BackError[]
}
```

A `Response` extends `BackErrorBag`. Every `BackError` provides `name`, `group`, `type`, `description` (if the server sends descriptions) and `info`.

## Filter Errors

Errors can be filtered with the fluent preset API, for example to show input errors next to a form field:

```typescript
import {Response, filterBackErrors} from "zation-client";

try {
    await client.request('auth/register', form);
}
catch (err) {
    if(err instanceof Response) {
        // plain filter (queric query on the error properties)
        const emailErrors = filterBackErrors(err.errors, {group: 'email'});

        // fluent filter builder
        const typeErrors = err.filter()
            .preset().valueNotMatchesWithType()
            .atPath('email')
            .execute();

        // catch handlers: the handler receives the matching errors
        err.catch()
            .preset().missingObjectProperty()
            .handle(errors => showMissing(errors))
            .catch(errors => showOther(errors)); // remaining errors
    }
    else throw err;
}
```

The builder methods `withName`, `withType`, `withGroup`, `atPath`, `withInfo`, `withCustom` and `or` can be combined; `preset()` offers filters for all built-in errors (e.g. `accessDenied`, `valueNotMatchesWithType`, `missingObjectProperty`).

## Options

| Option | Description |
| --- | --- |
| `apiLevel` | API level for this request. |
| `responseTimeout` | Timeout for the response. |
| `sendTimeout` | Timeout for sending while disconnected. |
| `batch` | Batch time in ms to bundle the request with other packages. |
| `cancelable` | Returns a `CancelablePromise` with a `cancel()` method. |
| `unwrapResult` | `false` to receive the `Response` object. |
| `processComplexTypes` | Enable when the data contains binaries or streams. |

## Validation Requests

Validate data against the input model of a controller without executing it:

```typescript
const response = await client.requestValidation('auth/register', [
    {path: 'email', value: 'test@example.com'},
    {path: 'password', value: '123'}
]);

// or with the typed checks builder
await client.requestValidation('auth/register', checks => {
    checks.email.check('test@example.com');
    checks.password.check('123');
});
```

## Authentication Controller

The `AUTH_CONTROLLER` constant addresses the authentication controller. `client.authenticate(data)` is a shortcut for a request to it.
