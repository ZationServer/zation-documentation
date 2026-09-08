# Streams

The client supports the same [streams](guides/server/streams.md) as the server.

## Send a Stream

Create a `WriteStream` and pass it inside the data of a request, transmit or databox signal:

```typescript
import {WriteStream} from "zation-client";

const stream = new WriteStream<true>(true); // binary stream
(async () => {
    const reader = file.stream().getReader();
    while(true) {
        const {value, done} = await reader.read();
        if(done) break;
        await stream.write(value.buffer);
    }
    await stream.end();
})();

const result = await client.request('files/upload', {
    fileName: file.name,
    file: stream
}, {processComplexTypes: true});
```

For JSON chunks create the stream without the binary flag: `new WriteStream()`.

## Receive a Stream

When a result, publish or databox value contains a stream, it arrives as a `ReadStream`:

```typescript
const {report} = await client.request('reports/download');

report.accept();
for await (const chunk of report) {
    chunks.push(chunk);
}
```

`accept()` must be called to start receiving; otherwise the stream is closed with `AcceptTimeout`.
Use `read()`, `readAll()` or the async iterator to consume chunks and `close(code)` to abort.

## Options

The client options `streamsPerPackageLimit`, `chunksCanContainStreams`, `lowSendBackpressureMark` and `binaryContentPacketTimeout` control the stream behaviour.
