# Receivers

Receivers are triggered with the `transmit` method. There is no response; the promise resolves when the package was sent.

```typescript
await client.transmit('chat/publishMessage', {
    chatId: '1',
    content: 'Hello!'
});
```

Because the server does not respond, invalid input or denied access is not reported to the client.
Use a [Controller](guides/client/controller.md) when you need feedback.

## Options

| Option | Description |
| --- | --- |
| `apiLevel` | API level for this package. |
| `sendTimeout` | Timeout for sending while disconnected (`null` = wait forever). |
| `batch` | Batch time in ms to bundle the package with other packages. |
| `cancelable` | Returns a `CancelablePromise`. |
| `processComplexTypes` | Enable when the data contains binaries or streams. |
