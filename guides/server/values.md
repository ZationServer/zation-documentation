# Values

A value model validates a single value like a string, a number or a date.

```typescript
input: {
    properties: {
        email: {type: 'email'},
        age: {type: 'int', minValue: 18, maxValue: 120},
        password: {type: 'string', minLength: 8, regex: /[0-9]/}
    }
}
```

## Type

The `type` property defines the expected type. It can also be an array of types; then at least one type must match.

| Type | Description |
| --- | --- |
| `all` | Any value. |
| `string`, `char` | A string / a single character. |
| `int`, `float`, `number` | Numbers. Numeric strings are converted unless `strictType` is `true`. |
| `boolean` | Booleans (also `0`/`1`, `'true'`/`'false'` unless strict). |
| `date` | A date string or timestamp, converted to a `Date` object. |
| `null` | Only `null`. |
| `object`, `array` | Any object / any array (without further structure checks). |
| `email`, `url`, `ip4`, `ip6`, `macAddress`, `mobileNumber` | Common string formats. |
| `sha1`, `sha256`, `sha384`, `sha512`, `md5`, `hexadecimal`, `hexColor` | Hash and hex formats. |
| `uuid3`, `uuid4`, `uuid5`, `mongoId`, `userId` | Id formats. |
| `isbn10`, `isbn13`, `json`, `mimeType`, `ascii`, `latLong` | Other formats. |
| `base64` | Base64 encoded content, with mime type validation. |
| `binary` | Binary data (`ArrayBuffer`). |
| `stream` | A [stream](guides/server/streams.md). |

`strictType: true` disables the type conversion, e.g. the string `'5'` is then not accepted for type `int`.
`convertType: false` keeps the raw value after validation instead of the converted one.

## Validation Functions

| Property | Applies to | Description |
| --- | --- | --- |
| `in: ['Red','Blue']` | all | The value must equal one of the items. The items are sent to the client in the error. |
| `privateIn: [...]` | all | Like `in`, but the items are not sent to the client. |
| `equals: value` | all | The value must be exactly equal. |
| `minLength`, `maxLength`, `length` | string | Length constraints. |
| `contains: 'a'` or `['a','b']` | string | The string must contain the given string(s). |
| `startsWith`, `endsWith` | string | Prefix / suffix. |
| `regex: /\w+/` or `{key: regex}` | string | One or more regular expressions. With an object the client learns which key failed. |
| `letters: 'lowercase'` / `'uppercase'` | string | Case constraint. |
| `charClass: 'a-zA-Z0-9'` | string | Allowed characters as a regex character class. |
| `minValue`, `maxValue` | number | Range constraints. |
| `minByteSize`, `maxByteSize` | string, base64 | Byte size constraints. |
| `mimeType: 'image'`, `mimeSubType: ['png','jpeg']` | base64 | Mime type of a data URI. |
| `before`, `after` | date | A `Date` or a function returning a `Date`. |

## Custom Validation

The `validate` property accepts one or more functions that can add errors to the `BackErrorBag`:

```typescript
{
    type: 'string',
    validate: async (value, backErrorBag, path, type) => {
        if(await usernameTaken(value)) {
            backErrorBag.add(new BackError({name: 'usernameTaken', type: ErrorType.ValidationError}, {path}));
        }
    }
}
```

## Convert

The `convert` function transforms the value after validation:

```typescript
{
    type: 'string',
    convert: (value: string) => value.trim().toLowerCase()
}
```
