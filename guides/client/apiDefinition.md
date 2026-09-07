# API Definition

The client can be typed with an API definition. 
With it, the identifiers, inputs, results, databox contents and channel events are checked by TypeScript.

## Define the API

```typescript
import {
    APIDefinition, ControllerDef, AuthControllerDef, ReceiverDef,
    DataboxDef, StaticDataboxDef, ChannelDef, StaticChannelDef
} from "zation-client";

type Profile = {id: string, name: string};
type Product = {name: string, price: number};
type ChatMessage = {userId: string, content: string};

type API = APIDefinition<{
    auth: {
        login: AuthControllerDef<{email: string, password: string}, void>
    },
    profile: {
        get: DataboxDef<Profile, string>            // content, member
    },
    products: StaticDataboxDef<Product[]>,
    chat: {
        sendMessage: ControllerDef<{chatId: string, text: string}, ChatMessage>,  // input, output
        publishMessage: ReceiverDef<{chatId: string, content: string}>,
        messages: DataboxDef<ChatMessage[], string, {lang: string}, {limit: number}>, // content, member, remote options, fetch input
        events: ChannelDef<{message: ChatMessage, typing: {userId: string}}, string> // publishes, member
    },
    news: StaticChannelDef<{news: {title: string}}>
}>;
```

Nested objects build the identifiers, e.g. `chat/sendMessage`.

## Create a Typed Client

```typescript
type TokenPayload = {email: string};

const client = Client.create<API, TokenPayload>({port: 3000});

await client.authenticate({email: 'a@b.de', password: 'secret'});   // typed input
const msg = await client.request('chat/sendMessage', {chatId: '1', text: 'Hi'}); // msg: ChatMessage
await client.transmit('chat/publishMessage', {chatId: '1', content: 'Hi'});

const messages = client.databox('chat/messages', {remoteOptions: {lang: 'de'}});
await messages.connect('1');
messages.data; // readonly ChatMessage[]

client.channel('chat/events').onPublish('message', (data) => data.content); // data: ChatMessage
client.authTokenPayload?.email;
```

## Sharing Types with the Server

Keep the API definition and the shared types in a package that both projects depend on, or generate the definition in the server project and export it.
Since the definition only contains types, it adds no runtime code to the client bundle.

The primary client exported as `client` is typed through the `PrimaryClient` interface.
Augment it in a declaration file to type the primary client:

```typescript
declare module "zation-client" {
    interface PrimaryClient {
        apiDefinition: API;
        tokenPayload: TokenPayload;
    }
}
```
