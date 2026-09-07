# Models

Models describe and validate the input of components. 
Every Controller and Receiver has an `input` option; Databoxes have `fetchInput`, `optionsInput` and `memberInput`; Channels have `memberInput`.
Zation validates the incoming data against the model, converts it (e.g. strings to numbers or dates) and sends detailed errors back to the client when the validation fails.

An input option accepts:

| Value | Description |
| --- | --- |
| a model | The input must match the model. |
| `'any'` | Any input is allowed and passed through unchanged. |
| `'nothing'` (default) | No input is allowed. |

## Model Types

There are four kinds of definition models:

| Model | Chapter |
| --- | --- |
| Value model: `{type: 'string', minLength: 3}` | [Values](guides/server/values.md) |
| Object model: `{properties: {...}}` or a class with `@ObjectModel()` | [Objects](guides/server/objects.md) |
| Array model: `[itemModel, {minLength: 1}]` | [Arrays](guides/server/arrays.md) |
| AnyOf model: `{anyOf: {...}}` | [AnyOf](guides/server/anyOf.md) |

Models can be nested arbitrarily.

## Reusable Models

Define models once and reuse them in multiple components. 
The `$model` function creates a named model which makes errors easier to identify; `$models` creates several at once:

```typescript
import {$model, $models} from "zation-server";

export const email = $model({type: 'email'}, 'email');

export const formModels = $models({
    name: {type: 'string', minLength: 2, maxLength: 40},
    age: {type: 'int', minValue: 18}
});
```

```typescript
@Controller.Config({
    input: {
        properties: {
            email,
            name: formModels.name
        }
    }
})
```

## Optional and Nullable

```typescript
import {$optional, $canBeNull} from "zation-server";

input: {
    properties: {
        name: {type: 'string'},
        nickname: $optional({type: 'string'}, 'anonymous'),
        avatar: $canBeNull({type: 'base64'})
    }
}
```

`$optional(model, defaultValue?)` allows the client to omit the property; the default value is used when it is missing.
`$canBeNull(model)` allows `null` instead of a value.

## Extending Models

`$extends(subModel, superModel)` lets a value model inherit from another value model or an object model from another object model (properties, prototype, constructors and convert functions are inherited and can be overridden):

```typescript
import {$extends, $model} from "zation-server";

const minString = $model({type: 'string', minLength: 2});

const animal = $model({
    properties: {
        name: $extends({maxLength: 10, startsWith: 'T'}, minString)
    }
});

const dog = $extends({
    properties: {
        likesToBark: {type: 'boolean'}
    }
}, animal);
```

!> `$extends` modifies the sub-model directly and cannot be used with class object models. Use class inheritance for those.

## Typed Input

For class object models, the class type can be used directly as the input type of the `handle` method.
For definition models you can derive the type with `TypeofModel`:

```typescript
import {TypeofModel} from "zation-server";

const person = $model({
    properties: {
        name: {type: 'string'},
        age: {type: 'int'}
    }
});

type Person = TypeofModel<typeof person>;
```

## Validation Requests

Clients can validate data against the input model of a controller without calling the controller (`client.requestValidation`).
This is useful to show live validation errors in forms.
