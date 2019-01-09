# Project Structure

In this Chapter, I will give you a short abstract overview of the structure from the created server project.  
In your main project code, you will see these folders and files they are listed below. 
I will explain this folder and files in this chapter.

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
In the config folder, you will find all your configurations, and this directory is connected with the Zation framework. 
If you want to rename this folder, you have to inform Zation with the configs property of the starter configuration. 
Below I give you a short description of every configuration file that can be in the config folder. 
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

The directory controllers contain all controller files. 
In the Chapter Controller, I explain more about it. 
This folder is not bound with the Zation framework, that means that you can rename it without changing anything of the starter config.