# Getting Started
This page will help you to install Zation with the Node.Js package manager and to create your first project by using the command line.

## Install Zation

To get started with Zation, you need to have Node.Js installed. 
You can follow these [instructions](https://nodejs.org/en/download/package-manager/) to install Node.Js. 
Once you have Node.Js installed, you can install Zation.  
To install Zation, you only need to run this command in your terminal:

[](../_code/install.sh ':include :type=bash')

!> **Problems ?** If you have any access problems with executing a command, you can try to run it with sudo or start the console as an admin.

## Structure of Projects

In most cases, you have at least two projects. 
The first is for the server (backend) that provides many services.
The second project is the client that will communicate to the backend. 
The client could be for example a mobile app, a website or desktop application.

## Create a Project 

For creating a project run one of the following commands in your terminal. 
But notice that Zation will use the current directory for initializing the project. 
You can optionally provide a folder name than Zation will create a new folder in the current directory and initializing the project in this folder.

[](../_code/createProject.sh ':include :type=bash')

By executing the command, Zation will ask you some questions about your project.
To create an individual base structure for your project.
Answer these questions and your project is successfully initialized.

!> **Note!** If you can choose between a TypeScript and JavaScript project, I strongly recommend to chose the TypeScript project. 
Because that this documentation based on the TypeScript variant. 
Also, you will get better code suggestions and analysis when you use an IDE like WebStorm or VisualStudio Code.
