# Arrays

An array model is defined with an array literal: the first item is the model of the array items, and the optional second item contains the array settings.

```typescript
input: {
    properties: {
        tags: [{type: 'string', maxLength: 20}, {minLength: 1, maxLength: 10}],
        persons: [person],
        matrix: [[{type: 'number'}]]
    }
}
```

| Setting | Description |
| --- | --- |
| `minLength` | Minimum number of items. |
| `maxLength` | Maximum number of items. |
| `length` | Exact number of items. |
| `convert` | Function that transforms the array after validation. |

Every item is validated with the item model. Errors contain the path of the invalid item (e.g. `tags.2`).

## Tuples

To validate an array with a fixed structure (a tuple), use an object model with numeric property keys.
Zation validates the array items by their index:

```typescript
input: {
    properties: {
        0: {type: 'string'},
        1: {type: 'number'},
        2: {type: 'string'}
    }
}
```
