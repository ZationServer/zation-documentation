# Streams

Zation supports streaming data in chunks between the client and the server, in both directions.
Streams can be embedded in any package: in the input of a controller or receiver, in a controller result, in databox content or channel publishes.
They implement backpressure, so a fast sender does not overwhelm a slow receiver.

A stream has two sides:

* `WriteStream`: created by the sender, writes chunks.
* `ReadStream`: received by the other side, reads chunks.

## Receive a Stream

Define a `stream` value model or a stream model in the input. The `chunks` option validates every chunk (`'binary'` for binary chunks):

```typescript
import {Controller, Socket, ReadStream} from "zation-server";

@Controller.Config({
    access: 'allAuth',
    input: {
        properties: {
            fileName: {type: 'string'},
            file: {chunks: 'binary', sizeLimit: 10 * 1024 * 1024}
        }
    }
})
export default class UploadFile extends Controller {

    async handle(socket: Socket, {fileName, file}: {fileName: string, file: ReadStream<ArrayBuffer>}) {
        file.accept();
        for await (const chunk of file) {
            await appendToFile(fileName, chunk);
        }
        return {ok: file.closedSuccessfully};
    }

}
```

`accept(options)` starts the stream. The options are `sizeLimit`, `bufferSize` and `chunkTimeout` (default 5000 ms).
Chunks can be read with the async iterator, `read()` (resolves `null` at the end) or `readAll()`.
A stream can be rejected or aborted with `close(StreamCloseCode.Abort)`.
For JSON chunks, use a model instead of `'binary'`, e.g. `{chunks: {properties: {...}}}`; the type `{type: 'stream'}` accepts any stream.

## Send a Stream

Create a `WriteStream` and return it inside the result (or pass it in a publish/transaction with `processComplexTypes: true`):

```typescript
import {Controller, Socket, WriteStream} from "zation-server";

@Controller.Config({access: 'allAuth'})
export default class DownloadReport extends Controller {

    async handle(socket: Socket) {
        const stream = new WriteStream<true>(true); // true = binary stream
        stream.useWriter(async (write, end) => {
            for await (const chunk of readReportChunks()) write(chunk);
            end();
        });
        return {report: stream};
    }

}
```

The `useWriter` callback receives `write(chunk)` and `end(lastChunk?)`. Writing waits automatically while the receiver's buffer is full.
`close(code)` aborts the stream with an error code. `closedSuccessfully` tells whether the stream ended without errors.

## Close Codes

| Code | Description |
| --- | --- |
| `StreamCloseCode.End` (200) | The stream ended successfully. |
| `ChunkTimeout` (400) | No chunk was received in time. |
| `BadConnection` (401) | The connection was lost. |
| `InvalidChunk` (402) | A chunk did not match the chunk model. |
| `SizeLimitExceeded` (403) | The size limit was exceeded. |
| `AcceptTimeout` (404) | The stream was not accepted in time. |
| `Abort` (407) | The stream was aborted. |

## Node.js Streams

The `ziron-node-stream-connector` package (loaded automatically by `zation-server`) connects ziron streams with Node.js streams, so a `ReadStream` can be piped into a file stream and a `WriteStream` can be fed from a readable Node.js stream.

## Limits

The server config options `streamsPerPackageLimit` (default 20) and `chunksCanContainStreams` (default `false`) limit the usage of streams per package.
