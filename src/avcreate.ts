#!/usr/bin/env node

import * as fs from 'fs';
import { Question, Answers } from 'inquirer';
import * as readline from 'readline';
import inquirer = require('inquirer');
import {AvGadgetManifest} from '@aardvarkxr/aardvark-shared';
import ValidatePackageName = require( 'validate-npm-package-name' );

let pkginfo = require( 'pkginfo' )( module, 'version' );

const rl = readline.createInterface( { input: process.stdin, output: process.stdout } );

let showHelp = true;

console.log( `Aardvark gadget project create script (${ pkginfo.version })` );


let questions: Question[] =
[
	{
		type: "input",
		name: "packageName",
		message: "What is the package name to use for your gadget?",
		validate: ( input: string, answers: Answers ) =>
		{
			let res = ValidatePackageName( input );
			if( !res.validForNewPackages )
			{
				return "Name must be a valid NPM package name";
			}
			else
			{
				return true;
			}
		}
	},
	{
		type: "input",
		name: "gadgetName",
		message: "What is the user-facing name of your gadget?",
		validate: ( input: string, answers: Answers ) =>
		{
			if( input.length > 0 )
			{
				return true;
			}
			else
			{
				return "You must provide a name for your gadget";
			}
		}
	},
	{
		type: "confirm",
		name: "usesPanels",
		message: "Does your gadget use panels (i.e. 2D quads in the world)?",
		default: true
	},
	{
		type: "number",
		name: "width",
		message: "Texture width",
		default: 1024,
		when: ( answers: Answers ) =>
		{
			return answers.usesPanels;
		}
	},
	{
		type: "number",
		name: "height",
		message: "Texture height",
		default: 1024,
		when: ( answers: Answers ) =>
		{
			return answers.usesPanels;
		}
	},
	{
		type: "confirm",
		name: "startsGadgets",
		message: "Does your gadget start other gadgets?",
		default: false
	},
];

let templateGadgetManifest:AvGadgetManifest =
{
	"name" : "Test Panel",
	"permissions" : [ "scenegraph" ],
	width: 1024,
	height: 1024,
	"model" : "models/placeholder.glb"
}

let templateTsConfig: any =
{
	"compilerOptions": {
		"target": "es2015",
		"module": "commonjs",
		"lib": ["es6", "es2015", "dom"],
		"declaration": true,
		"outDir": "dist",
		"rootDir": "src",
		"strict": true,
		"types": ["node"],
		"experimentalDecorators": true,
		"allowSyntheticDefaultImports": true,
		"importHelpers": true,
		"esModuleInterop": true,
		"resolveJsonModule": true,
		"moduleResolution" : "node"
	}
};

let templatePackageJson: any =
{
	"name": "",
	"version": "0.1.0",
	"description": "",
	"main": "index.js",
	"scripts": {
	  "build": "webpack --env=production",
	  "start": "webpack --env=dev --watch --progress"
	},
	"keywords": [],
	"author": "",
	"license": "",
	"repository": "",
	"devDependencies": {
	  "@types/color": "^3.0.0",
	  "@types/express": "^4.17.0",
	  "@types/react": "^16.8.22",
	  "@types/react-dom": "^16.8.4",
	  "@types/ws": "^6.0.2",
	  "copy-webpack-plugin": "^5.0.3",
	  "css-loader": "^3.0.0",
	  "html-webpack-plugin": "^3.2.0",
	  "mini-css-extract-plugin": "^0.7.0",
	  "npm": "^6.12.0",
	  "ts-loader": "^6.0.4",
	  "tslib": "^1.10.0",
	  "typescript": "^3.5.2",
	  "webpack": "^4.34.0",
	  "webpack-cli": "^3.3.6"
	},
	"dependencies": {
	  "@aardvarkxr/aardvark-react": "^0.0.4",
	  "@aardvarkxr/aardvark-shared": "^0.0.4",
	  "bind-decorator": "^1.0.11",
	  "react": "^16.8.6",
	  "react-dom": "^16.8.6"
	}
}
  
let templateCss =
`body, html
{
	background-color: lightskyblue;
	height: 100%;
}

.Button 
{
	background-color: lightcoral;
	font-size: 4rem;
}

.Label
{
	font-size: 4rem;
}
.Button:hover
{
	background-color: red;
}

.FullPage
{
	width: 100%;
	height: 100%;
}

.NoGrabHighlight
{
	background-color: white;
}

.InRangeHighlight
{
	background-color: lightblue;
}

.GrabbedHighlight
{
	background-color: blue;
}
`;

let templateHtml=
`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>GADGET_NAME</title>
	<link href="styles.css" rel="stylesheet">
  </head>

  <body>
    <div id="root" class="FullPage"></div>
  </body>
</html>
`

interface MyAnswers
{
	packageName: string;
	gadgetName: string;
	usesPanels: boolean;
	width?: number;
	height?: number;
	startsGadgets: boolean;
}

async function main()
{
	let answers = await inquirer.prompt( questions ) as MyAnswers;
	console.log( "Your answers: ", answers );

	let gadgetManifest = Object.assign( {}, templateGadgetManifest );
	gadgetManifest.name = answers.gadgetName;
	if( answers.usesPanels )
	{
		gadgetManifest.width = answers.width as number;
		gadgetManifest.height = answers.height as number;
	}
	else
	{
		gadgetManifest.width = 16;
		gadgetManifest.height = 16;
	}
	if( answers.startsGadgets )
	{
		gadgetManifest.permissions.push( "master" );
	}

	if( !fs.existsSync( "./src" ) )
	{
		fs.mkdirSync( "./src" );
		console.log( "Created ./src" );
	}

	if( !fs.existsSync( "./src/gadget_manifest.json" ) )
	{
		fs.writeFileSync( "./src/gadget_manifest.json", JSON.stringify( gadgetManifest, undefined, "\t" ) );
		console.log( "Added gadget_manifest.json" );
	}

	if( !fs.existsSync( "./tsconfig.json" ) )
	{
		fs.writeFileSync( "./tsconfig.json", JSON.stringify( templateTsConfig, undefined, "\t" ) );
		console.log( "Added tsconfig.json" );
	}

	if( !fs.existsSync( "./package.json" ) )
	{
		let packageJson = Object.assign( {}, templatePackageJson );
		packageJson.name = answers.packageName;
		packageJson.description = `Source for ${ answers.gadgetName } gadget`;
		fs.writeFileSync( "./package.json", JSON.stringify( packageJson, undefined, "\t" ) );
		console.log( "Added package.json" );
	}

	if( !fs.existsSync( "./src/styles.css" ) )
	{
		fs.writeFileSync( "./src/styles.css", templateCss );
		console.log( "Added src/styles.css" );
	}

	if( !fs.existsSync( "./src/index.html" ) )
	{
		let indexHtml = templateHtml.replace( "GADGET_NAME", answers.gadgetName );
		fs.writeFileSync( "./src/index.html", indexHtml );
		console.log( "Added src/index.html" );
	}
}

main();

