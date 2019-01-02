# Controller

The Zation framework is structured with controllers, each controller is one service that your backend is providing. 
For example, a controller can be a service to register a user, send a message, publish a post, authenticate a user or upload a profile avatar. 
How many or what controllers you have depends on your use cases. 
Each controller is protected by different layers. 
This is useful for example setting access rights for a controller. 
One use case can be that only admins can access the controller for deleting a user.
The controllers can be configured in the app configuration. 
The business logic of each controller should be located in the specific controller file in the controller directory. 
How this works will be explained in this chapter by showing you an example controller code for sending a message.

## The Basic Structure

In this Chapter, I will explain how the configuration of a controller is working and how you can configure your own controller.

### Declare a Controller

You need to create two parts for declaring a controller. 
The first part is the controller configuration here you configure the different layers there are protecting the controller and some basic controller configurations. 
The second part is the controller class which contains the business logic of the controller. 
In this Chapter, I will show you two ways to create these parts.

#### 1. Basic Declare

In the basic declare you split the two parts of the controller into different files.
The configuration part should be in the app configuration.
The controller class should be in a new file of the main controller directory. 

To declare the controller configuration part you have to create a specific object in the controller object of the app configuration. 
The name of the controller must be unique. 
In the code below you can see how it should look.

[](../_code/basicControllerConfig1.js ':include :type=js')

Now you can configure your controller in this specific object. 

The next step is to define where Zation can find the controller class.
For this Zation needs the file name and optionally the path to the file.
Zation is default searching in the controller folder for the file with the path and name. 
If you want to change the controller folder name, you can do it in the starter configuration.

You can set the name of the file with the "fileName" property in the controller configuration. 
If you don't provide this property, Zation will use the key identifier of the controller configuration as a file name.
If you want to provide a specific path to the controller file, you can use the "filePath" property. 
But consider that the path refers to the main controller directory.
See in the code below how it can look.

[](../_code/basicControllerConfig2.js ':include :type=js')


#### 2. Combine Declare

The combine declare combines the two parts of the controller in one file. 

## Controller Configuration

### Access

#### User Group Access

#### Protocol Access

#### Version Access

### Input 

## Controller Class

### Handle 

#### Return Result

#### Error Handling

### Other Methods

## The Authentication Controller

The authentication controller is a special controller that you can configure in the app Configuration. 
The purpose of this controller is to authenticate a user. 
Zation will automatically use this controller when the client is sending an authentication request. 
If you don't configure an authentication controller the server will respond with a task error when getting an authentication request. 
So it is recommended to set an authentication controller.  
In the code below you can see how to set the authentication controller in the app configuration.

[](../_code/authenticationController.js ':include :type=js')

The value should be the key of the controller in the controller object.

 