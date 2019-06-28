#!/usr/bin/env node

// Volons Command Line Interface
// =============================
// This sofware is used to generate docker-compose.yml for Volons' docker containers.
// It helps the user to create files within an interactive command line interface.
// Supported features:
// - Generate Volons' docker-compose.yml ( WIP )
// - Start / Stop containers
// - Print useful information about running containers
// - Open default web-browser with Fleet Monitor
// Dependencies
// - docker
// - docker-compose

const exec = require( 'executive' );
const fs = require( 'fs' );
const YAML = require( 'json2yaml' );
const path = require( 'path' );

const DockerCompose = require( './DockerCompose.js' );

const p = require( './Print.js' );
const store = require( './Store.js' );

// Use unique px4 simulated drone
const _UNIQUE_SIM_ = true;
const _DEFAULT_HOME_POSITION_ = '47.479219, 4.339885, 300';
const _DOCKER_COMPOSE_FILENAME_ = 'volons-docker-compose.yml';

// x: shortcut to exec command line sync and quiet
const x = function( command ) {
    return exec.quiet( command, { sync: true } );
};

// function to print Help message from file
const helpFilePath = x( 'npm root -g', { options: 'quiet', sync: true } ).stdout.trim() + '/volons/cli/help/';

const printHelp = function( helpFile ) {
    p.log( x( `cat ${ helpFilePath }${ helpFile }` ).stdout );
};

let dockerCompose = {};
let stepNumber = 1;
// store docker-compose.yml path
let dockerFilePath = '';
// is using global npm directory CLI option '-g'
let useGlobalDir = true; // default

const initSequence = function( entryVal, dockerCompose, droneCounter ) {
    let adminToken = Math.random().toString(36).substr(2); // Generate random ID string (like 'qs8x53qb3u')

    if ( entryVal === '' ) {
        p.info( `Create Volons configuration with generated token:` );
    } else {
        adminToken = entryVal;
        p.info( `Create Volons configuration with your custom token:` );
    }

    p.info( adminToken );
    p.warn( '/!\\ You should save this token to connect the hive.' );

    dockerCompose.init( adminToken );

    p.logNoCR( `\n${ stepNumber++ }: Add a first drone to the simulator, enter drone name or press enter to use: 'drone-${ droneCounter }': ` );

    return 'ADD_DRONE';
};

const addDroneSequence = function( entryVal, dockerCompose, droneCounter ) {
    const newDroneName = ( entryVal === '' ) ? `drone-${ droneCounter }` : entryVal;

    dockerCompose.addDrone( newDroneName );

    p.info( `New drone: ${ newDroneName } has been added to simulator.` );

    if ( !_UNIQUE_SIM_ && droneCounter < 8 ) {
        p.logNoCR( '\nDo you want to add another drone [Y/n]? ' );
        droneCounter++;
        return 'DRONE_NAME';
    }
    p.logNoCR( `\n${ stepNumber++ }: Set home position location or press enter to use: '${ _DEFAULT_HOME_POSITION_ }': ` );
    return 'HOME_POSITION';
};

const droneNameSequence = function( entryVal, dockerCompose, droneCounter ) {
    if ( entryVal === '' || entryVal.toLowerCase() === 'yes' || entryVal.toLowerCase() === 'y' ) {
        p.logNoCR( `\n${ stepNumber++ }: Add a new drone to the simulator, enter drone name or press enter to use: 'drone-${ droneCounter }': ` );
        return 'ADD_DRONE';
    }
    return 'END';
};

const homePositionSequence = function( entryVal ) {
    if ( entryVal !== '' ) {
        entryVal = _DEFAULT_HOME_POSITION_;
    }

    let vals = entryVal.split( ', ' );

    if ( vals === null || vals.length !== 3 || isNaN( vals[ 0 ] ) || isNaN( vals[ 1 ] ) || isNaN( vals[ 2 ] ) ) {
        // Home position dont match regular expression for position
        p.error( `Error: '${ entryVal }': This location does't match a regular position : '[Latitude], [Longitude], [Altitude (meter)] string.` );
        p.logNoCR( `Enter a valid location or press enter to use: '${ _DEFAULT_HOME_POSITION_ }' as default home position.` );
        return 'HOME_POSITION';
    }

    p.info( `Home position has been set to: latitude: ${ vals[ 0 ] }, longitude: ${ vals[ 1 ] }, altitude: ${ vals[ 2 ] }.` );
    dockerCompose.setDefaultHomePosition( vals[ 0 ], vals[ 1 ], vals[ 2 ] );

    p.logNoCR( `\n${ stepNumber++ }: Do you want to use a personal Google Map API with Monitor Web UI [Y/n]? ` );
    return 'USE_GMAP';
};

const useGMapSequence = function( entryVal ) {
    if ( entryVal === '' || entryVal.toLowerCase() === 'yes' || entryVal.toLowerCase() === 'y' ) {
        p.logNoCR( 'Enter your Google Map API key (39 alpha numeric case-sensitive characters): ' );
        return 'GMAP_API_KEY';
    }

    dockerCompose.setDefaultGoogleMapAPIkey();

    p.warn( '/!\\ WARNINNG /!\\' );
    p.warn( 'The Monitor has been configured to use Volons\' global Google Map API Key,' );
    p.warn( 'This API key is shared with all volons\' users but have a very limited quotas.' );
    p.warn( 'If the map doesn\'t appeare correctly in the Monitor, we recommend to use a personal Google Map API Key.' );

    return 'END';
};

const saveGMapAPIKeySequence = function( entryVal ) {
    // GMapAPIKey.length should be 39 chars string.
    if ( entryVal === null || entryVal.length !== 39 ) {
        p.logNoCR( `The Google map API key:[${ entryVal }] is not valid. Do you want to use a personal Google Map API [Y/n] ? ` );
        return 'USE_GMAP';
    }
    dockerCompose.setGMapApiKey( entryVal );
    p.info( `Your personal Google MAP API Key has been saved: [${ entryVal }].` );
    return 'END';
};

const init = function() {
    printHelp( 'init.txt' );

    process.stdin.setEncoding('utf8');
    const stdin = process.openStdin();

    p.logNoCR( `${ stepNumber++ }: Enter your token or press enter to generate new token: ` );

    let sequence = 'INIT';
    let droneCounter = 1;

    stdin.addListener( 'data', function( d ) {
        const entryVal = d.toString().trim();

        switch ( sequence ) {
            // case 'INIT' : sequence = initSequence( entryVal, dockerCompose, droneCounter ); break;
            case 'ADD_DRONE': sequence = addDroneSequence( entryVal, dockerCompose, droneCounter ); break;
            case 'DRONE_NAME': sequence = droneNameSequence( entryVal, dockerCompose, droneCounter ); break;
            case 'HOME_POSITION': sequence = homePositionSequence( entryVal ); break;
            case 'USE_GMAP': sequence = useGMapSequence( entryVal ); break;
            case 'GMAP_API_KEY': sequence = saveGMapAPIKeySequence( entryVal, dockerCompose ); break;
            default: break;
        }

        if ( sequence === 'END' ) {
            process.stdin.pause();

            p.info( '\n\nVolons\' containers have been configured.' );
            p.log( `The ${ _DOCKER_COMPOSE_FILENAME_ } file has been saved to` );
            p.log( `${ dockerFilePath }${ _DOCKER_COMPOSE_FILENAME_ }\n` );
            const msgGlobal = '';
            if ( useGlobalDir )
                msgGlobal = '-g';
            p.log( `Next: to start Volons' docker containers run \`volons start${ msgGlobal }\`.\n` );

            fs.writeFileSync( `${ dockerFilePath }${ _DOCKER_COMPOSE_FILENAME_ }`, dockerCompose.toYML() );
            store.addDockerCompose( dockerCompose );
        }
    } );
};

// function to start docker containers
const start = function() {
    printHelp( 'start.txt' );
    let stderr = x( `docker ps` ).stderr;
    // check if docker is installed and docker deamon is runing
    if ( stderr ) {
        p.error( 'Error: Cannot run Docker command: \`docker ps\`. ', stderr );
    } else {
        // docker deamon is runing
        // TODO
        // Check if current docker-compose is allready started before.
        // let { stdout, stderr } = x( `docker inspect -f {{.State.Running}} volons-cli_fms_1` );
        // if ( stderr || stdout.trim() === 'false' ) {
        p.warn( 'Entering docker-compose console (Press CTRL+C to kill all process)\n' );

        exec.interactive( `cd ${ dockerFilePath };docker-compose -f ${ _DOCKER_COMPOSE_FILENAME_ } up`, err => { process.exit( 0 ); } );
        // forward CTRL-C to docker-compose
        process.on('SIGINT', function () {
            exec.interactive( `cd ${ dockerFilePath };docker-compose kill -f ${ _DOCKER_COMPOSE_FILENAME_ } -s SIGINT`, err => { process.exit( 0 ); } );
        });
        // } else {
        //     p.info( 'Volons is already runing.' );
        // }
        // END TODO
    }
};

const pull = function() {
    printHelp( 'pull.txt' );
    let stderr = x( `docker ps` ).stderr;
    // check if docker is installed and docker deamon is runing
    if ( stderr ) {
        p.error( 'Error: Cannot run Docker command: \`docker ps\`. ', stderr );
    } else {
        exec.interactive( `cd ${ dockerFilePath };docker-compose -f ${ _DOCKER_COMPOSE_FILENAME_ } pull`, err => { process.exit( 0 ); } );
    }
};
const stop = function() {
    printHelp( 'stop.txt' );
    let stderr = x( `docker ps` ).stderr;
    // check if docker is installed and docker deamon is runing
    if ( stderr ) {
        console.log( 'Error: Cannot run Docker command: \`docker ps\`. ', stderr );
    } else {
        exec.interactive( `cd ${ dockerFilePath };docker-compose -f ${ _DOCKER_COMPOSE_FILENAME_ } kill -s SIGINT`, err => {
            if ( err ) {
                p.error( 'Error: No Volons\' container is running.', err );
            }
            process.exit( 0 );
        } );
    }
};

// Open web browser with monitor url
const monitor = function() {

    const monitorUrl = `http://${ dockerCompose.getIPAddress( 'fms' ) }:8181/`;

        console.log( `Fleet Management System Monitor URL: ${ monitorUrl }` );
    exec.interactive( `open ${ monitorUrl }`, err => { process.exit( 0 ); } );
};

const ls = function() {
    printHelp( 'ls.txt' );
    p.log( store.list() );
};

const rm = function( args ) {
    if ( args.length !== 2 ) {
        printHelp( 'rm.txt' );
        p.error( 'Error: Project_ID parameter is missing. Usage: `volons rm [Projec ID]`.' );
        return;
    }

    const dockerComposeId = args[ 1 ].trim();

    if ( store.removeDockerCompose( dockerComposeId ) ) {
        p.info( `Project ${ dockerComposeId } has been removed.` );
    } else {
        printHelp( 'rm.txt' );
        p.error( `Error: Cannot remove project ${ dockerComposeId } from Volons' project list. Sorry, you have to do it manualy.` );
    }
};

const ps = function() {
    // docker-compose ps
    const dockerPsCmd = exec.quiet( `docker-compose -f ${ dockerFilePath }${ _DOCKER_COMPOSE_FILENAME_ } ps`, ( err, stdout, stderr ) => {

        if ( stderr ) {
            printHelp( 'ps.txt' );
            p.error( 'Error: Cannot list containers.', stderr );
            return;
        }

        let str = stdout.trim();

        let allVolonsContainers = str.split( '\n' ).splice( 2 );

        if ( !allVolonsContainers.length ) {
            printHelp( 'ps.txt' );
            p.error( 'Error: No container is running. Execute `volons start` to run Volons\' containers.' );
            return;
        }

        let counter = 1;
        const info = {};
        p.log( '\nVolons Docker Runing Container Information' );
        p.log( '==========================================' );
        allVolonsContainers.forEach( ( proc ) => {
            const procName = proc.split( ' ' )[ 0 ];

            console.log( `&&${ proc.split( ' ' )[ 0 ] }&&` );

            const dockerInspect = x( `docker inspect ${ procName }` );
            if ( dockerInspect.stderr ) {
                p.error( '`Error: Cannot execute `docker inspect`.', dockerInspect.stderr );
                return;
            }
            let inspect = {};
            try { 
                inspect = JSON.parse( dockerInspect.stdout )[ 0 ];
            } catch ( execption ) {
                p.error( 'Error: Cannot JSON.parse `docker inspect` result.', execption );
                return;
            }

            const processInfo = info[ `${ counter++ }/ ${ procName }` ] = {
                'Name': procName
            };

            if ( inspect.State && inspect.State.Status ) {
                processInfo.State = inspect.State.Status;
            }

            if ( inspect.Config && inspect.Config.Labels && inspect.Config.Labels[ 'com.docker.compose.service' ] ) {
                processInfo.Service = inspect.Config.Labels[ 'com.docker.compose.service' ];
            }

            if ( inspect.NetworkSettings && inspect.NetworkSettings.Networks && inspect.NetworkSettings.Networks[ 'volons-cli_volons' ] ) {
                processInfo.IPAddress = inspect.NetworkSettings.Networks[ 'volons-cli_volons' ].IPAddress;
            }

            if ( inspect.NetworkSettings && inspect.NetworkSettings.Ports && inspect.NetworkSettings.Ports ) {
                const ports = inspect.NetworkSettings.Ports;
                Object.keys( ports ).forEach( ( port ) => {
                    if ( ports[ port ] && ports[ port ][ 0 ] && ports[ port ][ 0 ].HostIp && ports[ port ][ 0 ].HostPort ) {
                        if ( !processInfo.Ports ) {
                            processInfo.Ports = [ ports[ port ][ 0 ].HostIp + '/' + ports[ port ][ 0 ].HostPort ];
                        } else {
                            processInfo.Ports.push( ports[ port ][ 0 ].HostIp + '/' + ports[ port ][ 0 ].HostPort );
                        }
                    }
                } );
            }

            if ( inspect.Config && inspect.Config.Env ) {
                processInfo.Environment = inspect.Config.Env;
            }
        } );

        Object.keys( info ).forEach( ( k ) => {
            p.warn( k );
            p.log( YAML.stringify( info[ k ] ).substring( 4 ) );
        } );
        p.info( `\`volons ps\` found ${ counter - 1 } constainers.` );

    } );
};

// get args parameters 
// 2 first eleems are paths
const args = process.argv.slice(2);

if ( args.length === 0 ) {
    printHelp( 'help.txt' );
} else {
    useGlobalDir = true;
    dockerFilePath = path.join( __dirname, './volons-cli/' );

    dockerCompose = new DockerCompose( dockerFilePath + _DOCKER_COMPOSE_FILENAME_, store.getSubnetIpInc( dockerFilePath ) );

    switch ( args[ 0 ].toLowerCase() ) {
        case 'help': printHelp( 'help.txt' ); break;
        case 'start': start(); break;
        case 'stop': stop(); break;
        case 'pull': pull(); break;
        case 'init': init(); break;
        case 'monitor': monitor(); break;
        case 'ps': ps(); break;
        case 'ls': ls(); break;
        case 'rm': rm( args ); break;
        default:
            printHelp( 'help.txt' );
            p.error( `Command "${ args[ 0 ] }" not found` );
            break;
    }
}
