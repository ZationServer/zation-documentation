# Controller

The Zation framework is structured with controllers. 
Each controller is one service that your backend is providing. 
For example, a controller can be a service to register a user, send a message, publish a post, authenticate a user or upload a profile avatar. 
How many or what controllers you have depends on your use cases. 

Different layers are protecting each controller, this useful for example setting access rights for a controller. 
One use case can be that only admins can access the controller for deleting a user. 
The controllers can be added in the app configuration. 
The business logic and configuration of each controller should be located in the specific controller class. 
How this works will be explained in this chapter by showing you example controller code. 
This chapter will also explain the purpose of the authentication controller and how you can set default values for every controller.

## Create Controller

This chapter will help you to create your controllers. 
It will explain what possibilities you have to configure them and how they are work.
We will be beginning by creating a basic skeletal controller structure and add the controller to the app configuration. 
Then you will learn more about the controller configuration and how you can set up the logic of a controller.

### Define a Basic Controller

The controller consists of two parts. 
The first part is the controller configuration where you can configure the different layers there are protecting the controller and some basic controller options. 
The second part is the business logic of the controller it describes what happens when the controller gets a request.  
This subchapter will show you where and how you can define these parts and how you can connect your controller to the framework.

First, we create a controller file. 
To beginning with a basic template, we are using the following command in the terminal:

[](../../_code/initController.sh ':include :type=bash')

You can optionally run the command with a path than the controller will be created at this path relative to your current directory. 
While running this command, Zation will ask you if you are using a TypeScript project and what the name of the controller should be. 
After answer, these questions and executing you should find a file which looks similar to the code below.

!> **Problems ?**  If you have problems with the terminal command, then you can create a new file manually and copy the template from the code example.

[](../../_code/controllerTemplate.ts ':include :type=ts')

You can see in the code, that each controller needs to extend the main Controller class from the Zation framework.
The controller configuration part is located in the static config property of each controller class. 
The methods of the class are the business logic of each controller. 
The next Chapters will explain more about it.

The next step is to add the controller to the app configuration so Zation can find the controller.
To do this, we first need to import the controller in the app configuration. 
After that, we can add it to the controllers object.
The property key is the controller id, and the value will be the imported controller class. 
The controller id must be unique and will be used to identify a controller when the client is communicating to the backend.
You can see it at the example code below.

[](../../_code/addController.ts ':include :type=ts')

After that, we successful defined a basic controller.
The next step is to configure this controller and add some logic.

### Controller Configuration

This chapter will explain more about the controller configuration. 
It will demonstrate all the possibilities you have to configure a controller.

#### Access
One of the important configurations is the access configuration. 
But we have multiple possibilities to define access rights. 
This chapter will explain all the different options. 
Note that you can combine all of these options.

##### Client Token State Access

With the client token state access, we can set access rights which depends on the actual state of a token. 
That can be for example the user group, user id or additional token variables.

!> **Token ?** The token is like an id card of a client. The client only has a token when its authenticated. You also can set individual variables on a token with the bag.

To set some rules, we are using the property access or the inverted property notAccess, only one of them is allowed.
If you do not specify either of them, the access will be denied. 
Below you can see some examples what the value could be.

[](../../_code/controllerUserStateAccess.ts ':include :type=ts')

##### Protocol Access

With the protocol access, you can set access rights which depends on the request protocol.
That can be useful to avoid the MethodIsNotCompatible error. 
This error can happen by calling a function on the bag which is only available on a specific protocol.

To set some rules, you have the two properties wsAccess and httpAccess.
Both are taking a boolean as a value and have the default value true.
In the code below you can see some examples.

[](../../_code/protocolAccess.ts ':include :type=ts')

##### HTTP Method Access

With the HTTP method access, you can define access rights which depends on the requested HTTP method. 
These access rights will only be used when the request protocol is HTTP.

To set these access rights, we have two properties the httpGetAllowed and httpPostAllowed property. 
Both of them taking a boolean as a value and have the default value true.
Below you can see some examples.

[](../../_code/httpMethodAccess.ts ':include :type=ts')

##### Version Access

With the version access, you can set access rights which depends on the version and system of the client.

To set rules, you have to use the property versionAccess. 
There is no default value, so if you don't provide this property, the version and system will just not be checked. 
The value of this property must be an object where you can specify the rules.
Below you can see some examples.

[](../../_code/versionAccess.ts ':include :type=ts')

#### Input 

### Controller Logic 

#### Handle 

##### Return Result

##### Error Handling

#### Other Methods

## The Controller Defaults

## The Authentication Controller

The authentication controller is a special controller that you can configure in the app Configuration. 
The purpose of this controller is to authenticate a user. 
Zation will automatically use this controller when the client is sending an authentication request. 
If you don't configure an authentication controller the server will respond with a task error when getting an authentication request. 
So it is recommended to set an authentication controller.  
In the code below you can see how to set the authentication controller in the app configuration.

[](../../_code/authenticationController.ts ':include :type=ts')

The value should be the controller id that is defined as a key of a controller in the controllers object.

 