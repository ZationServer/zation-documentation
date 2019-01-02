# Getting Started

In this Chapter, I want to show you how to install Zation with the node package manager and create a Zation project by using the command line.

## Install Zation

To get started with Zation, you need to have Node.Js installed. 
You can follow these [instructions](https://nodejs.org/en/download/package-manager/) to install Node.Js. 
Once you have Node.Js installed, you can install Zation.  
For install Zation you only need to run this command:

[](../_code/install.sh ':include :type=bash')

!> **Problems ?** If you have any problems on a Unix machine while executing a command try to run it with sudo.

## Structure of Projects

In most cases, you have at least two projects. 
One is for the server (backend) that provides many services that can be used. 
The second project is the client that will communicate to the backend. 
The client could be for example a mobile app, a website or desktop application.

## Create a Project 

For creating a project run one of the following commands.
But notice that Zation will use the current directory for initializing the project. 
You can optionally provide a folder name than Zation will create a new folder in the current directory and initializing the project in this folder.

[](../_code/createProject.sh ':include :type=bash')

By executing the command Zation will ask you some questions about your project.
To create an individual base structure for your project.
Answer these questions and your project is successfully initialized.
