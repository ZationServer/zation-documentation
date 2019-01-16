# Project Structure

This Chapter will give you a short abstract overview of the structure from the created server project.  
In your main project code, you will see these folders and files they are listed below.

!> **Type Script ?** If you have created a TypeScript project, you will find your main project code in the src folder.

* configs
    * app.config.ts
    * main.config.ts
    * channel.config.ts
    * event.config.ts 
    * service.config.ts
    * error.config.ts  
* controllers
* index.ts

The index.ts file is the main entry point of your project. 
This file will invoke the start method of the Zation Framework, which will start the server. 
The start method takes the starter configuration as a parameter.

The directory controllers contain all controller files. 
Later you will learn more about it.
 
In the configs folder, you will find all your configurations. 
If you want to rename this folder or a configuration file, you have to inform Zation about it in the starter configuration. 
In the example code below, you can see how you can do it. 

[](../../_code/renameConfig.ts ':include :type=ts')

All configuration files are useful and have a different meaning.
Below you can find a short description for each configuration file.
Note that every configuration file is optional.

**app.config.ts**  
The App configuration defines all about your app e.g., user groups, controllers, background tasks. 

**main.config.ts**  
The Main configuration describes the settings of the server and the Zation framework. 

**channel.config.ts**  
In the Channel configuration, you can find all settings about the Zation channels and declarations of own custom channels.

**event.config.ts**  
In the Event configuration, you can react on specific server events.

**service.config.ts**  
The Service configuration contains all definitions and credentials of services that you need, e.g., MySQL, PostgreSQL, NodeMailer, MongoDB.

**error.config.ts**  
In the Error configuration, you can define custom errors.

