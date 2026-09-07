# Receivers

A Receiver handles a package from a client that does not need a response.
It is the fire-and-forget counterpart of a Controller and is useful for actions like moving a player, typing indicators or publishing into a channel.

```typescript
import {Receiver, Socket, Inject, ObjectModel, ModelProp} from "zation-server";
import {ChatChannel} from "../channels/chat";

@ObjectModel()
class ChatMessage {
    readonly chatId = ModelProp({type: 'string'});
    readonly content = ModelProp({type: 'string', maxLength: 500});
}

@Receiver.Config({
    access: 'allAuth',
    input: ChatMessage
})
export class PublishMessageReceiver extends Receiver {

    @Inject(ChatChannel)
    private readonly chatChannel: ChatChannel;

    handle(socket: Socket, input: ChatMessage) {
        this.chatChannel.publish(input.chatId, 'message', input.content);
    }

}
```

The configuration options are the same as for a [Controller](guides/server/controller.md): `access`, `input` and `backErrorCollectionLimit`.
Defaults can be defined with `receiverDefaults` in the app config.

Because there is no response, thrown errors are not sent to the client. 
Unknown errors trigger the `error` event; invalid input calls the `invalidInput` method.

On the client, a receiver is triggered with `client.transmit('publishMessage', {...})`, see [Client Receivers](guides/client/receivers.md).
