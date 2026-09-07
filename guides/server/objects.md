# Objects

An object model describes an object with properties. There are two ways to define it: with a definition object or with a class.

## Definition Object

```typescript
input: {
    properties: {
        name: {type: 'string', maxLength: 20},
        age: {type: 'int', minValue: 10, maxValue: 100},
        address: {
            properties: {
                city: {type: 'string'},
                zip: {type: 'string', length: 5}
            }
        }
    },
    morePropsAllowed: false
}
```

| Option | Description |
| --- | --- |
| `properties` | The properties and their models. Every property is required unless it is wrapped with `$optional`. |
| `morePropsAllowed` | Allow unknown properties (default `false`). |
| `prototype` | An object that is set as the prototype of the input object. |
| `baseConstruct`, `construct` | Functions called with the input object as `this` after validation (`baseConstruct` of a super model runs first). |
| `convert` | Transforms the object after validation and construction. |

## Class Object Model

With the `@ObjectModel()` decorator you define a model as a class. 
The validated input is an instance of the class, so methods of the class are available in the handle method.

```typescript
import {ObjectModel, ModelProp, Model, Constructor, Controller, Socket} from "zation-server";

@ObjectModel()
class Device {
    @Model({type: 'int'})
    deviceId: number;
}

@ObjectModel()
class Phone extends Device {

    screenSize = ModelProp({type: 'number', minValue: 3, maxValue: 10});

    producer = ModelProp({type: 'string'});

    @Constructor()
    async init() {
        // async initialisation with access to the validated input (this)
    }

    getDeviceCode() {
        return this.producer + '-' + this.deviceId;
    }
}

@Controller.Config({
    access: 'all',
    input: Phone
})
export default class RegisterDevice extends Controller {
    async handle(socket: Socket, phone: Phone) {
        return phone.getDeviceCode();
    }
}
```

Properties can be declared either with the `ModelProp` function (which also provides the TypeScript type) or with the `@Model` decorator.
Class object models support inheritance: the sub-model inherits all properties and constructor functions of the super class.

A class object model can be used everywhere a model is expected, also nested inside other models:

```typescript
input: {
    properties: {
        owner: Person,
        phones: [Phone, {maxLength: 3}]
    }
}
```
