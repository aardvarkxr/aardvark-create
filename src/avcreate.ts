#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { Question, Answers } from 'inquirer';
import * as readline from 'readline';
import inquirer = require('inquirer');
import { AardvarkManifest, Permission } from '@aardvarkxr/aardvark-shared';
import ValidatePackageName = require( 'validate-npm-package-name' );

let pkginfo = require( 'pkginfo' )( module, 'version', 'dependencies' );

const rl = readline.createInterface( { input: process.stdin, output: process.stdout } );

let showHelp = true;

console.log( `Aardvark gadget project create script (${ module.exports.version })` );

let avreactVersion = module.exports.dependencies["@aardvarkxr/aardvark-react" ];
let avsharedVersion = module.exports.dependencies["@aardvarkxr/aardvark-shared" ];

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

let templateGadgetManifest:AardvarkManifest =
{
	xr_type: "aardvark-gadget@" + avsharedVersion,
	name: "Test Panel",
	icons:
	[
		{
			src: "models/placeholder.glb",
			type: "model/gltf-binary"
		}
	],
	aardvark:
	{
		permissions: [ Permission.SceneGraph ],
		browserWidth: 1024,
		browserHeight: 1024,	
		startAutomatically: false,
	},
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
		"strict": false,
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
	  "start": "webpack --env=dev --watch --progress",
	  "dev-server": "http-server ./dist -p 8080 -c-1 --cors"
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
	  "http-server": "^0.12.3",
	  "mini-css-extract-plugin": "^0.7.0",
	  "npm": "^6.12.0",
	  "source-map-loader": "^0.2.4",
	  "style-loader": "^1.2.1",
	  "ts-loader": "^6.0.4",
	  "tslib": "^1.10.0",
	  "typescript": "^3.5.2",
	  "webpack": "^4.34.0",
	  "webpack-cli": "^3.3.6"
	},
	"dependencies": {
	  "@aardvarkxr/aardvark-react": avreactVersion,
	  "@aardvarkxr/aardvark-shared": avsharedVersion,
	  "bind-decorator": "^1.0.11",
	  "react": "^16.13.1",
	  "react-dom": "^16.13.1"
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
	<link href="styles.css?<%= htmlWebpackPlugin.options.now %>" rel="stylesheet">
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
			filename: '[name].js',
			path: path.resolve( __dirname, './dist' ),
		},

		plugins:
		[
			new HtmlWebpackPlugin(
				{
					hash: true,
					filename: "./index.html",
					template: "./src/index.html",
					now: Date.now()
				}
			),
			new CopyPlugin(
				[
					{ from: './src/styles.css', to: 'styles.css' },
					{ from: './src/manifest.webmanifest', to: 'manifest.webmanifest' },
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
				}
					
			]
		},

		resolve:
		{
			modules:[ path.resolve( __dirname, 'node_modules' ) ],
			extensions: [ '.ts', '.tsx', '.js' ]
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
`import { AvGadget, AvPanel, AvStandardGrabbable, AvTransform, HighlightType, DefaultLanding, GrabbableStyle, renderAardvarkRoot } from '@aardvarkxr/aardvark-react';
import { EAction, EHand, g_builtinModelBox, InitialInterfaceLock, Av } from '@aardvarkxr/aardvark-shared';
import bind from 'bind-decorator';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const k_TestPanelInterface = "test_panel_counter@1";

interface TestPanelState
{
	count: number;
	grabbableHighlight: HighlightType;
}

interface TestSettings
{
	count: number;
}

interface TestPanelEvent
{
	type: "increment" | "set_count";
	count?: number;
}

class MyGadget extends React.Component< {}, TestPanelState >
{
	private m_actionListeners: number[];
	private m_grabbableRef = React.createRef<AvStandardGrabbable>();

	constructor( props: any )
	{
		super( props );
		this.state = 
		{ 
			count: 0,
			grabbableHighlight: HighlightType.None,
		};
	}

	public componentDidMount()
	{
		if( !AvGadget.instance().isRemote )
		{
			this.m_actionListeners = 
			[
				AvGadget.instance().listenForActionStateWithComponent( EHand.Invalid, EAction.A, this ),
				AvGadget.instance().listenForActionStateWithComponent( EHand.Invalid, EAction.B, this ),
				AvGadget.instance().listenForActionStateWithComponent( EHand.Invalid, EAction.Squeeze, this ),
				AvGadget.instance().listenForActionStateWithComponent( EHand.Invalid, EAction.Grab, this ),
				AvGadget.instance().listenForActionStateWithComponent( EHand.Invalid, EAction.Detach, this ),
			];

			AvGadget.instance().registerForSettings( this.onSettingsReceived );
		}
		else
		{
			let params = AvGadget.instance().findInitialInterface( k_TestPanelInterface )?.params as TestSettings;
			this.onSettingsReceived( params );			
		}
	}

	public componentWillUnmount()
	{
		if( !AvGadget.instance().isRemote )
		{
			for( let listener of this.m_actionListeners )
			{
				AvGadget.instance().unlistenForActionState( listener );
			}

			this.m_actionListeners = [];
		}
	}

	@bind public incrementCount()
	{
		if( AvGadget.instance().isRemote )
		{
			let e: TestPanelEvent = { type: "increment" };
			this.m_grabbableRef.current?.sendRemoteEvent( e, true );
		}
		else
		{
			this.setState( ( oldState ) => 
				{ 
					return { ...oldState, count: oldState.count + 1 };
				} );
		}
	}

	public componentDidUpdate()
	{
		if( !AvGadget.instance().isRemote )
		{
			let e: TestPanelEvent = { type: "set_count", count: this.state.count };
			this.m_grabbableRef.current?.sendRemoteEvent( e, true );
		}
	}


	@bind public onSettingsReceived( settings: TestSettings )
	{
		if( settings )
		{
			this.setState( { count: settings.count } );
		}
	}

	@bind
	private onRemoteEvent( event: TestPanelEvent )
	{
		switch( event.type )
		{
			case "increment":
				if( AvGadget.instance().isRemote )
				{
					console.log( "Received unexpected increment event on remote" );
				}
				else
				{
					this.incrementCount();
				}
				break;
			
			case "set_count":
				if( !AvGadget.instance().isRemote )
				{
					console.log( "Received unexpected set_count event on master" );
				}
				else
				{
					this.setState( { count: event.count } );
				}
				break;		
		}
	}

	public renderActionStateLabel( action: EAction )
	{
		if( AvGadget.instance().getActionStateForHand( EHand.Invalid, action ) )
			return <div className="Label">{ EAction[ action ] }: TRUE</div>;
		else
			return <div className="Label">{ EAction[ action ] }: false</div>;
	}

	public renderRemote()
	{
		return (
			<>
				<div className="Label">Count: { this.state.count }</div>
				<div className="Label">This gadget is owned by somebody else</div>
				<div className="Button" onMouseDown={ this.incrementCount }>
					Increment count...
				</div> 
			</>
		);
	}

	public renderLocal()
	{
		return <>
				<div className="Label">Count: { this.state.count }</div>
				<div className="Label">This gadget is owned by me</div>
				<div className="Button" onMouseDown={ this.incrementCount }>
					Increment count...
				</div> 
				{ this.renderActionStateLabel( EAction.A ) }
				{ this.renderActionStateLabel( EAction.B ) }
				{ this.renderActionStateLabel( EAction.Squeeze ) }
				{ this.renderActionStateLabel( EAction.Grab ) }
				{ this.renderActionStateLabel( EAction.Detach ) }
			</>
	}

	public render()
	{
		let sDivClasses:string = "FullPage";

		let remoteInitLocks: InitialInterfaceLock[] = [];

		if( !AvGadget.instance().isRemote )
		{
			remoteInitLocks.push( {
				iface: k_TestPanelInterface,
				receiver: null,
				params: 
				{
					count: this.state.count,
				}
			} );
		}

		return (
			<div className={ sDivClasses } >
				<div>
					<AvStandardGrabbable modelUri={ g_builtinModelBox } modelScale={ 0.03 } remoteGadgetCallback={ this.onRemoteEvent }
						modelColor="lightblue" style={ GrabbableStyle.Gadget } remoteInterfaceLocks={ remoteInitLocks } ref={ this.m_grabbableRef }>
						<AvTransform translateY={ 0.16 } >
							<AvPanel interactive={true} widthInMeters={ 0.2 }/>
						</AvTransform>
					</AvStandardGrabbable>
				</div>
				{ AvGadget.instance().isRemote ? this.renderRemote() : this.renderLocal() }
			</div> );
	}

}

renderAardvarkRoot( "root", <MyGadget/> );
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

	console.log( `Using @aardvarkxr/aardvark-react@${ avreactVersion } and @aardvarkxr/aardvark-shared@${ avsharedVersion }` );

	let gadgetManifest: AardvarkManifest = { ...templateGadgetManifest };
	gadgetManifest.name = answers.gadgetName;
	if( answers.usesPanels )
	{
		gadgetManifest.aardvark.browserWidth = answers.width as number;
		gadgetManifest.aardvark.browserHeight = answers.height as number;
	}
	else
	{
		gadgetManifest.aardvark.browserWidth = 16;
		gadgetManifest.aardvark.browserHeight = 16;
	}

	if( answers.startsGadgets )
	{
		gadgetManifest.aardvark.permissions.push( Permission.Master );
	}

	if( !fs.existsSync( "./src" ) )
	{
		fs.mkdirSync( "./src" );
		console.log( "Created ./src" );
	}

	if( !fs.existsSync( "./src/manifest.webmanifest" ) )
	{
		fs.writeFileSync( "./src/manifest.webmanifest", JSON.stringify( gadgetManifest, undefined, "\t" ) );
		console.log( "Added manifest.webmanifest" );
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

