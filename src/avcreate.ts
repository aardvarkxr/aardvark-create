#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
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
	{
		type: "confirm",
		name: "wantsVSCode",
		message: "Do you want to debug with VS Code?",
		default: true
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
		"jsx": "react",
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
	  "source-map-loader": "^0.2.4",
	  "ts-loader": "^6.0.4",
	  "tslib": "^1.10.0",
	  "typescript": "^3.5.2",
	  "webpack": "^4.34.0",
	  "webpack-cli": "^3.3.6"
	},
	"dependencies": {
	  "@aardvarkxr/aardvark-react": "^0.0.5",
	  "@aardvarkxr/aardvark-shared": "^0.0.7",
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

let templateWebPackConfig =
`
const path = require('path');
var HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const CopyPlugin = require('copy-webpack-plugin');

module.exports = 
[
	{
		mode: "development",
		devtool: "inline-source-map",

		entry: './src/main.tsx',

		output:
		{
			filename: 'index.js',
			path: path.resolve( __dirname, './dist' ),
		},

		plugins:
		[
			new HtmlWebpackPlugin(
				{
					hash: true,
					filename: "./index.html",
					template: "./src/index.html"
				}
			),
			new CopyPlugin(
				[
					{ from: './src/styles.css', to: 'styles.css' },
					{ from: './src/gadget_manifest.json', to: 'gadget_manifest.json' },
					{ from: './src/models/placeholder.glb', to: 'models/placeholder.glb' },
				]
				),
		],
		
		module: 
		{
			rules:
			[
				{ 
					test: /\.tsx?$/,
					use: 'ts-loader',
					exclude: /node_modules/
				},
				{
					test: /\.css$/,
					use: 
					[
						'style-loader',
						'css-loader'
					]
				},
				{
					test: /\.(png|svg|jpg|gif)$/,
					use: 
					[
						'file-loader'
					]
				},
				{
					test: /\.js$/,
					use: ['source-map-loader'],
					enforce: 'pre',
					exclude: [ /@tlaukkan/ ] // TSM has source maps but not source
				}
					
			]
		},
	}
];

`;


let templateLaunchJson =
`{
	// Use IntelliSense to learn about possible attributes.
	// Hover to view descriptions of existing attributes.
	// For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
	"version": "0.2.0",
	"configurations": [
		{
			"type": "chrome",
			"request": "attach",
			"name": "Attach to aardvark_renderer",
			"sourceMaps": true,
			//"trace":"verbose",
			"port": 8042,
			"webRoot":"\${workspaceFolder}",
			"sourceMapPathOverrides": {
				// If you have local Git clones of @aardvarkxr/aardvark-react or @aardvarkxr/aardvark-shared,
				// you can use those repos as your source of these two packages with "npm install <path>" for each one.
				// But if you do that, source maps will get lost, so you also need to set the environment variable
				// "AV_SHARED_SRC=C:/some/path/aardvark-shared" so the following rules can make the source maps work 
				// through the sym linked packages. NOTE THE FORWARD SLASHES!
				"webpack:///../aardvark-react/*": "\${env:AV_REACT_SRC}/*",
				"webpack:///../aardvark-shared/*": "\${env:AV_SHARED_SRC}/*",
				"webpack:///./~/*": "\${webRoot}/node_modules/*",       // Example: "webpack:///./~/querystring/index.js" -> "/Users/me/project/node_modules/querystring/index.js"
				"webpack:///./*":   "\${webRoot}/*",                    // Example: "webpack:///./src/app.js" -> "/Users/me/project/src/app.js",
				"webpack:///*":     "*",                               // Example: "webpack:///project/app.ts" -> "/project/app.ts"
				"webpack:///src/*": "\${webRoot}/*",                    // Example: "webpack:///src/app.js" -> "/Users/me/project/app.js"
				"meteor://💻app/*": "\${webRoot}/*"                    // Example: "meteor://💻app/main.ts" -> "/Users/me/project/main.ts"
			}
		},
	]
}`;

let templateMainTsx=
`import * as React from 'react';
import  * as ReactDOM from 'react-dom';

import bind from 'bind-decorator';

import { AvGadget, AvTransform, AvPanel, AvGrabbable, HighlightType, GrabResponse, AvSphereHandle } from '@aardvarkxr/aardvark-react';
import { EndpointAddr, AvGrabEvent, endpointAddrToString } from '@aardvarkxr/aardvark-shared';


interface TestPanelState
{
	count: number;
	grabbableHighlight: HighlightType;
}

interface TestSettings
{
	count: number;
}

class TestPanel extends React.Component< {}, TestPanelState >
{
	private m_panelId?: EndpointAddr;

	constructor( props: any )
	{
		super( props );
		this.state = 
		{ 
			count: 0,
			grabbableHighlight: HighlightType.None,
		};

		AvGadget.instance().registerForSettings( this.onSettingsReceived );
	}

	@bind public incrementCount()
	{
		this.setState( { count: this.state.count + 1 } );

		let newSettings: TestSettings = { count: this.state.count + 1 };
		AvGadget.instance().saveSettings( newSettings );
	}

	@bind public onHighlightGrabbable( highlight: HighlightType )
	{
		this.setState( { grabbableHighlight: highlight } );
	}

	@bind public onGrabRequest( grabRequest: AvGrabEvent ): Promise< GrabResponse >
	{
		// this is totally unnecessary, but a good test of the plumbing.
		let response: GrabResponse =
		{
			allowed: true,
		};
		return Promise.resolve( response );
	}

	@bind public onSettingsReceived( settings: TestSettings )
	{
		if( settings )
		{
			this.setState( { count: settings.count } );
		}
	}

	public render()
	{
		let sDivClasses:string;
		let scale = 0.4;
		switch( this.state.grabbableHighlight )
		{
			default:
			case HighlightType.None:
				sDivClasses = "FullPage NoGrabHighlight";
				break;

			case HighlightType.InRange:
				sDivClasses = "FullPage InRangeHighlight";
				break;

			case HighlightType.Grabbed:
				sDivClasses = "FullPage GrabbedHighlight";
				break;

			case HighlightType.InHookRange:
				sDivClasses = "FullPage GrabbedHighlight";
				scale = 0.05;
				break;
		
		}

		return (
			<div className={ sDivClasses } >
				<div>
					<AvGrabbable updateHighlight={ this.onHighlightGrabbable }
						onGrabRequest={ this.onGrabRequest }
						dropOnHooks={ true }>
						<AvSphereHandle radius={0.1} />
						
						<AvTransform uniformScale={ scale }>
							<AvPanel interactive={true}
								onIdAssigned={ (id: EndpointAddr) => { this.m_panelId = id } }/>
						</AvTransform>
					</AvGrabbable>
				</div>
				<div className="Label">Count: { this.state.count }</div>
				<div className="Button" onMouseDown={ this.incrementCount }>
					Click Me!
					</div> 

				{ this.m_panelId && 
					<div>
						My ID is { endpointAddrToString( this.m_panelId as EndpointAddr ) }
					</div>
				}
			</div>
		)
	}
}

ReactDOM.render( <TestPanel/>, document.getElementById( "root" ) );
`;

interface MyAnswers
{
	packageName: string;
	gadgetName: string;
	usesPanels: boolean;
	width?: number;
	height?: number;
	startsGadgets: boolean;
	wantsVSCode: boolean;
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

	if( !fs.existsSync( "./src/main.tsx" ) )
	{
		fs.writeFileSync( "./src/main.tsx", templateMainTsx );
		console.log( "Added src/main.tsx" );
	}

	if( !fs.existsSync( "./src/index.html" ) )
	{
		let indexHtml = templateHtml.replace( "GADGET_NAME", answers.gadgetName );
		fs.writeFileSync( "./src/index.html", indexHtml );
		console.log( "Added src/index.html" );
	}

	if( !fs.existsSync( "./src/models" ) )
	{
		fs.mkdirSync( "./src/models" );
		console.log( "Created ./src/models" );
	}

	if( !fs.existsSync( "./src/models/placeholder.glb" ) )
	{
		fs.copyFileSync( path.resolve( __dirname, "../src/placeholder.glb" ),
			"./src/models/placeholder.glb" )
		console.log( "Added src/models/placeholder.glb" );
	}

	if( !fs.existsSync( "./webpack.config.js" ) )
	{
		fs.writeFileSync( "./webpack.config.js", templateWebPackConfig );
		console.log( "Added webpack.config.js" );
	}

	if( answers.wantsVSCode )
	{
		if( !fs.existsSync( "./.vscode" ) )
		{
			fs.mkdirSync( "./.vscode" );
			console.log( "Created ./.vscode" );
		}
	
		if( !fs.existsSync( "./.vscode/launch.json" ) )
		{
			fs.writeFileSync( "./.vscode/launch.json", templateLaunchJson );
			console.log( "Added .vscode/launch.json" );
		}
	}

}

main();

