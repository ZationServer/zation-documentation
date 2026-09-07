# Controller

A Controller handles a request from a client and sends a response back.
Each controller is one service that your backend provides, for example registering a user, sending a message or publishing a post.

## Define a Controller

You can generate a controller with `zation createComponent <Name>` or create the file manually:

```typescript
import {Controller, Socket, Packet, BackErrorBag} from "zation-server";

@Controller.Config({
    access: 'all',
})
export default class SendMessage extends Controller {

    async initialize() {
        // called once when the server starts
    }

    async handle(socket: Socket, input: any, packet: Packet) {
        return {sent: true};
    }

    async invalidInput(socket: Socket, rawInput: any, packet: Packet, backErrorBag: BackErrorBag) {
        // called when the input validation failed
    }

}
```

Then register it with a [Router or the Register decorator](guides/server/components.md).

## Configuration

| Option | Default | Description |
| --- | --- | --- |
| `access` | from `controllerDefaults`, otherwise denied | Access rules, see [Access Rules](guides/server/accessRules.md). |
| `input` | `'nothing'` | Input model, `'any'` or `'nothing'`, see [Models](guides/server/models.md). |
| `backErrorCollectionLimit` | | Maximum number of collected errors before the response is sent. |

Defaults for all controllers can be defined with `controllerDefaults` in the app config.

## Handle

The `handle` method receives the socket, the validated (and converted) input and the packet.
The returned value is sent back to the client as the result. It can be any JSON-compatible data; binaries and streams are supported too (see [Streams](guides/server/streams.md)).

```typescript
@Controller.Config({
    access: 'allAuth',
    input: {
        properties: {
            chatId: {type: 'string'},
            text: {type: 'string', maxLength: 500}
        }
    }
})
export default class SendMessage extends Controller {

    @Inject(ChatChannel)
    private readonly chatChannel: ChatChannel;

    async handle(socket: Socket, {chatId, text}: {chatId: string, text: string}) {
        const message = {userId: socket.userId, text, created: Date.now()};
        // persist the message ...
        this.chatChannel.publish(chatId, 'message', message);
        return message;
    }

}
```

The `Packet` gives you access to `packet.apiLevel` and a request-scoped `packet.attachment` object where you can store data for this request.

## Errors

To send errors back to the client, throw a `BackError` or a `BackErrorBag`:

```typescript
import {BackError, BackErrorBag, ErrorType} from "zation-server";

async handle(socket: Socket, {email}) {
    if(await userExists(email)) {
        throw new BackError({
            name: 'emailAlreadyExists',
            group: 'register',
            type: ErrorType.InputError,
            description: 'The email is already registered.',
            sendInfo: true
        }, {email});
    }
}
```

A `BackError` consists of a `name`, an optional `group`, a `type` (see `ErrorType`), a `description` and an `info` object.
The `description` is only sent to the client when `sendErrorDescription` is enabled in the server config.
The `info` is only sent when `sendInfo` is `true`. Mark errors that must not leave the server with `private: true`.

Multiple errors can be collected in a `BackErrorBag`:

```typescript
const errorBag = new BackErrorBag();
if(!validName) errorBag.add(new BackError('invalidName'));
if(!validAge) errorBag.add(new BackError('invalidAge'));
errorBag.throwIfHasError();
```

Every other thrown error is treated as an unknown error: the `error` event is triggered, and the client receives an `UnknownError` without details.

## Invalid Input

When the input validation fails, Zation sends the validation errors to the client automatically and calls the `invalidInput` method.
You can use it to add custom errors to the `backErrorBag` or to log the attempt.

## The Authentication Controller

The `AuthController` is a special controller used to authenticate a client.
There can only be one authentication controller in the app, and the client can call it with `client.authenticate(data)`.
The handle method must call `socket.authenticate` when the credentials are valid; otherwise, the client receives an `AuthenticationFailedError`.

```typescript
import {AuthController, Socket, BackError, ObjectModel, ModelProp} from "zation-server";

@ObjectModel()
class Credentials {
    email = ModelProp({type: 'email'});
    password = ModelProp({type: 'string', minLength: 3});
}

@Controller.Config({
    access: 'allNotAuth',
    input: Credentials
})
export default class Login extends AuthController {

    async handle(socket: Socket, {email, password}: Credentials) {
        const user = await findUser(email, password);
        if(!user) throw new BackError('invalidCredentials');
        await socket.authenticate('user', user.id, {email});
    }

}
```

Read the [Authentication](guides/server/authentication.md) chapter for details about tokens.

## Validation Requests

Clients can validate input against the input model of a controller without executing the handle method (`client.requestValidation`).
The number of checks per request is limited by `validationCheckLimit` in the server config.
