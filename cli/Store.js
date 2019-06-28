/* eslint-disable no-sync */
const YAML = require( 'json2yaml' );
const exec = require( 'executive' );
const fs = require( 'fs' );

const p = require( './Print.js' );

const x = function( command ) {
    return exec.quiet( command, { sync: true } );
};

const _DATASTORE_FILENAME_ = 'datastore.json';

class Store {
    constructor() {
        this.dataFile = `${ x( 'npm -g root' ).stdout.trim() }/volons/cli/volons-cli/${ _DATASTORE_FILENAME_ }`;
        if ( fs.existsSync( this.dataFile ) ) {
            this._load();
        } else {
            this._initStore();
        }
    }

    _initStore() {
        this.store = {
            networkSubnetIncrement: 10,
            dockerComposes: []
        };
    }

    _load() {
        let fileStr = null;

        try {
            fileStr = fs.readFileSync( this.dataFile );
        } catch ( exception ) {
            p.error( `Error: Loadding DataStore File: ${ this.dataFile }`, exception );
            return false;
        }

        try {
            this.store = JSON.parse( fileStr );
        } catch ( exception ) {
            p.info( fileStr );
            p.error( `Error: Cannot parse DataStore file: ${ this.dataFile }`, exception );
            return false;
        }

        return true;
    }

    _save() {
        if ( !this.store ) {
            return false;
        }

        let storeStr = '';

        try {
            storeStr = JSON.stringify( this.store, null, 2 );
        } catch ( exception ) {
            p.error( 'Error: Cannot serialize DataStore', exception );
            return false;
        }

        // if ( this.store.dockerComposes.lenght === 0) {
        //     return fs.unlinkSync( this.dataFile );
        // }

        try {
            fs.writeFileSync( `${ this.dataFile }`, storeStr );
        } catch ( exception ) {
            p.error( `Error: Cannot save DataStore to file: ${ this.dataFile }`, exception );
            return false;
        }

        return true;
    }

    _set( key, val ) {
        p.log( `set key: ${ key } with value: ${ val }` );
        this.store[ key ] = val;

        return this._save();
    }

    _get( key ) {
        if ( !this.store ) {
            throw new Error( `Cannont get key: ${ key }. DataStore: ${ this.dataFile } is undefined.` );
        }

        const keyInStore = Object.keys( this.store ).filter( ( path ) => path === key );
        if ( keyInStore ) {
            return this.store[ keyInStore ];
        }

        throw new Error( `Key: ${ key } is undefined in DataStore: ${ this.dataFile }.` );
    }

    removeDockerCompose( dockerComposeId ) {
        if ( !this.store || !dockerComposeId ) {
            return false;
        }

        const selectedDockerCompose = this.store.dockerComposes.filter( ( dc ) => dc.id === dockerComposeId );

        if ( selectedDockerCompose && selectedDockerCompose.length === 1 ) {
            try {
                fs.unlinkSync( selectedDockerCompose[ 0 ].filePath );
            } catch ( exception ) {
                p.warn( `Cannot delete docker-compose.yml: ${ selectedDockerCompose[ 0 ].filePath }. ${ exception }` );
            }
            this.store.dockerComposes = this.store.dockerComposes.filter( ( dc ) => dc.id !== dockerComposeId );
            return this._save();
        }
        return false;

    }

    addDockerCompose( dockerCompose ) {
        this.store.dockerComposes = this.store.dockerComposes.filter( ( dc ) => dc.filePath !== dockerCompose.filePath );
        dockerCompose.id = Math.random().toString( 36 ).substr( 2 );
        // generate random string Ex.: 'zeru01hz1bb'
        this.store.dockerComposes.push( dockerCompose );
        return this._save();
    }

    getSubnetIpInc( filePath ) {
        const currentDockerCompose = this.store.dockerComposes.filter( ( dc ) => dc.filePath === filePath );

        if ( currentDockerCompose.lenght === 1 ) {
            return currentDockerCompose[ 0 ].subnetIpInc;
        }
        this.store.networkSubnetIncrement++;
        return this.store.networkSubnetIncrement;
    }

    list() {
        if ( this.store.dockerComposes.length === 0 ) {
            return 'Projet list is empty. To create a first project run: `volons init`.\n';
        }

        const list = {};

        this.store.dockerComposes.forEach( ( dc ) => {
            list[ `Project [${ dc.id }]` ] = {
                'Id': dc.id,
                'Directory': dc.filePath,
                'Network subnet': dc.networks.volons.ipam.config[ 0 ].subnet,
                'Fleet Management System IP address': dc.fmsIp,
                'Token': dc.services.fms.environment[ 0 ].substring( 12 )
            };
        } );

        return YAML.stringify( list ).substring( 4 );
    }
}

module.exports = new Store();
