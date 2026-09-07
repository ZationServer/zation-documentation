# AnyOf

An `anyOf` model accepts a value that matches at least one of several models.
The models can be defined in an object (the keys name the alternatives, which helps to read the validation errors) or in an array.

```typescript
const animal = $model({
    properties: {
        name: {type: 'string'}
    }
});

input: {
    properties: {
        pet: {
            anyOf: {
                dog: $extends({
                    properties: {
                        likesToBark: {type: 'boolean'}
                    }
                }, animal),
                cat: $extends({
                    properties: {
                        indoor: {type: 'boolean'}
                    }
                }, animal)
            }
        },
        id: {
            anyOf: [{type: 'int'}, {type: 'uuid4'}]
        }
    }
}
```

The value is accepted as soon as one alternative matches; the converted value of that alternative is passed on.
If none matches, the client receives the errors of all alternatives, grouped by the key (or index) of the alternative.
