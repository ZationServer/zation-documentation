# TypeScript Project

>If you did not create a **TypeScript** server project, then you can skip this chapter. Note that is recommended to create a TypeScript project.

Bellow, you can see a list of some folders and files of your created typeScript project which are essential for this chapter. 
In the next paragraph, I am explaining these folders and files.

+ src
+ dist
+ gulpFile.js
+ tsconfig.json

In the src folder, you will find your main project code which is written in TypeScript. 
For translating this code in JavaScript (which can be executed with Node.js) we are using the TypeScript compiler and Gulp. 
All configurations for the typescript compiler can be found in the tsconfig.json file. 
You can read more about it [here](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).
The generated translated JavaScript code will be stored in the dist folder.
The file gulpFile.js contains the logic for automatically building the JavaScript code.

You can run the build with the command npm run build.
If you want that Gulp is automatically run the build if you change a file, you can use the command npm run watch. 
By default, Zation is running automatically the build every time before starting the project with npm start.
If you don't want that, you can change the prestart property of the scripts object in the package.json file. 
If you don't know anything about the package.json file, you can read about it [here](https://docs.npmjs.com/files/package.json).

