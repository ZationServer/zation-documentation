# Advanced Bag

This chapter covers the advanced functions of the [Bag](guides/server/basicsBags.md).

## Disconnect and Deauthenticate

These functions work cluster-wide, so sockets connected to other servers are affected too.

```typescript
bag.disconnectUser(userId, {code: 4001, data: 'banned'});
bag.disconnectTokens(tokenId);
bag.disconnectSockets(socketSid);
bag.disconnectAuthUserGroups('user');
bag.disconnectDefaultUserGroup();
bag.disconnectAllSockets();

bag.deauthenticateUser(userId, exceptSocketSids);
bag.deauthenticateTokens(tokenId);
bag.deauthenticateSockets(socketSid);
bag.deauthenticateAuthUserGroups('user');
bag.deauthenticateAllSockets();
```

The `sid` of a socket is unique in the whole cluster and contains the server id: `bag.socketSidToSeverId(sid)`, `bag.socketSidToSocketId(sid)`.

## Tokens

```typescript
// sign a Zation auth token manually (e.g. to send it by email)
const signedToken = await bag.signZationToken('user', userId, {email});
const token = await bag.verifyZationToken(signedToken);

// sign/verify arbitrary JSON web tokens with the auth options of the server
const jwt = await bag.signToken({purpose: 'resetPassword'}, {expiresIn: 600});
const payload = await bag.verifyToken(jwt);
```

The client can authenticate with a signed token via `client.signAuthenticate(signedToken)`.

## Cryptography

```typescript
const {hash, salt} = await bag.scrypt(password, salt);
bag.hashSha512(string, salt);
bag.hash('sha256', string);

const keys = await bag.generateRsaAsymmetricKeyPair();
const signature = await bag.asymmetricRsaSign(data, keys.privateKey);
await bag.asymmetricRsaVerify(data, keys.publicKey, signature);
await bag.asymmetricRsaEncrypt(data, keys.publicKey);
await bag.asymmetricRsaDecrypt(encrypted, keys.privateKey);

const eccKeys = await bag.generateEccAsymmetricKeyPair();
bag.asymmetricEccSign(data, eccKeys.privateKey);

const password = await bag.generatePassword();
const iv = await bag.generateIv();
const encrypted = await bag.symmetricEncrypt(message, password, iv);
await bag.symmetricDecrypt(encrypted, password, iv);
```

## Random Values

```typescript
bag.generateRandomString(32);
bag.generateFixedRandomNumber(6);
bag.generateRandomIntInRange(1, 10);
bag.generateRandomFloatInRange(0, 1);
bag.generateRandomBoolean(0.3);
await bag.generateRandomBytes(16);
bag.getRandomArrayItem(items);
```

## Cleanup and Exit

Register cleanup handlers that run before the server exits, or keep the process alive until a promise settles:

```typescript
const unregister = bag.cleanup(async () => {
    await db.close();
});

bag.exitAwait(pendingWrite);
```

`bag.interval(ms)` returns an async iterator that can be used with `for await`; call the provided function to stop it:

```typescript
for await (const clear of bag.interval(2000)) {
    if(await done()) clear();
}
```

## System Information

```typescript
await bag.getCpuUsage();
await bag.getMemoryUsage();   // {totalMemMb, usedMemMb}
await bag.getPidUsage();      // {cpu, memory}
await bag.getOsName();
bag.machineId;
```

## Ports

```typescript
await bag.isPortAvailable(3000);
await bag.findAPortNotInUse([3000, 3001, 3002]);
```

## API Level Switcher

```typescript
const getVersion = bag.createApiLevelSwitcher({
    1: () => 'v1',
    3: () => 'v3'
});
getVersion(socket.apiLevel)();
```

## Base64 Helpers

```typescript
bag.base64ByteSize(encoded);
bag.base64ContentInfo(encoded); // {mimeType, mimeSubType} of a data URI
bag.stringByteSize(string);
```
