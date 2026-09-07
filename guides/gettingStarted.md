# Getting Started

This page helps you to install the Zation CLI and to create your first server and client project.

## Requirements

Zation runs on Node.js. Install a current LTS version of Node.js (16 or newer) by following these [instructions](https://nodejs.org/en/download/package-manager/).
Zation is written in TypeScript, and all guides in this documentation use TypeScript. 
It is strongly recommended to write your backend in TypeScript too, because the framework relies on decorators and you get full type checking and IDE support.

## Install the CLI

The Zation CLI creates projects and components from templates. Install it globally:

```bash
npm i -g zation
```

You can check the installed versions with:

```bash
zation -v
```

!> **Problems ?** If you have any access problems executing a command, you can try to run it with sudo or start the console as an admin.

## Structure of Projects

In most cases, you have at least two projects. 
The first is the server (backend) that provides the API.
The second project is the client that communicates with the backend. 
The client could be a mobile app, a website or a desktop application.

## Create a Server Project

Run the following command in the directory where the project folder should be created.
The CLI asks you a few questions (description, author, port, git repository) and generates a ready-to-run TypeScript project.

```bash
zation createServer myServer
# or the short alias
zation cs myServer
```

Afterwards, install the dependencies and start the server:

```bash
cd myServer
npm install
npm start
```

The generated project already contains an authentication controller (`auth/login`) and a Databox (`profile/get`), a server configuration with an active panel and a test file.
Look at the [Project Structure](guides/server/projectStructure.md) chapter to understand the generated files.

## Create a Client Project

To create a client project, use:

```bash
zation createClient myClient
# or the short alias
zation cc myClient
```

You can choose between a Node.js client and a web client (bundled with webpack).
Both use the `zation-client` package. Read the [Client Basics](guides/client/basics.md) chapter to learn how to communicate with the server.

## Interactive Create

The `create` command asks which type of project (server or client) you want to create:

```bash
zation create myApp
```

## Create a Component

Inside a server project, you can generate a Controller, Receiver, Databox, StaticDatabox, Channel or StaticChannel from a template:

```bash
zation createComponent SendMessage
# or the short alias
zation cco SendMessage
```

The CLI asks for the component type and creates the file in the current working directory.
Use the `-f` (`--force`) option to skip confirmation prompts for directory modifications.

## Without the CLI

You can also add Zation to an existing project. Install the packages directly:

```bash
# Server
npm i zation-server
# Client
npm i zation-client
# Test helper (dev dependency)
npm i -D zation-assured
```

Make sure that `experimentalDecorators` and `emitDecoratorMetadata` are enabled in your `tsconfig.json`, otherwise the component decorators will not work.
