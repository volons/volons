// Volons DockerCompose.js
// =======================
// This class map docker-compose structure to
// store services, network and configuration and
// generate YML docker-compose file into volons npm global directory

const YAML = require( 'json2yaml' );
const { Hive, Simulator, Px4 } = require( 'ContainerService.js' );


class DockerCompose {
    constructor( filePath, subnetIpInc ) {
        this.version = '3';
        this.networks = {
            volons: {
                ipam: {
                    config: [ { subnet: '172.' + subnetIpInc + '.0.0/24' } ]
                }
            }
        };
        this.services = {};

        // FilePath and subnetIpInc for data store
        this.filePath = filePath;
        this.subnetIpInc = subnetIpInc;

        // You can change IPs for custom usages
        // double check that IPs match volons network subnet below
        this.fmsIp = '172.' + subnetIpInc + '.0.5';
        this.simulatorIp = '172.' + subnetIpInc + '.0.6';

        // Start px4 drone IP from 172.20.0.7
        // then increment latest number
        this.dronePrefixIp = '172.' + subnetIpInc + '.0.';
        this.droneStartIp = 7;
        this.droneCount = 0;
        this.useDefaultGmapAPIKey = false;
    }

    // kind of private method to addService
    _addService( name, service ) {
        this.services[ name ] = service;
    }

    _getService( serviceName ) {
        return this.services[ serviceName ] || null;
    }

    _setEnv( serviceName, key, value ) {
        const service = this._getService( serviceName );
        if ( service === null ) {
            // service is undefined
            return null;
        }
        if ( !service.environment ) {
            service.environment = [];
        }
        let updateEnv = false;
        service.environment.forEach( ( env ) => {
            if ( env.split( '=' )[ 0 ] === key ) {
                // update value
                env = `${ key }=${ value }`;
                updateEnv = true;
            }
        } );
        // new env
        if ( !updateEnv ) {
            service.environment.push( `${ key }=${ value }` );
        }
    }
    // end privates methods

    init( token ) {
        const hive = new Hive( this.fmsIp, token );
        const sim = new Simulator( this.simulatorIp );
        this._addService( 'fms', hive );
        this._addService( 'simulator', sim );
    }

    setDefaultHomePosition( latitude, longitude, altitude ) {
        this._setEnv( 'simulator', 'PX4_HOME_LAT', latitude );
        this._setEnv( 'simulator', 'PX4_HOME_LON', longitude );
        this._setEnv( 'simulator', 'PX4_HOME_ALT', altitude );
    }

    setGMapApiKey( apiKey ) {
        this.useDefaultGmapAPIKey = false;
        this._setEnv( 'fms', 'GMAP_API_KEY', apiKey );
    }

    getIPAddress( serviceName ) {
        const service = this._getService( serviceName );
        if ( service && service.networks && service.networks.volons && service.networks.volons.ipv4_address ) {
            return service.networks.volons.ipv4_address;
        }
        return undefined;
    }

    addDrone( name ) {
        // generate next px4 and vehicle-mavlink containers' IPAdress
        const px4Ends = this.droneStartIp + this.droneCount * 2;
        const vehicleName = name.trim().toLowerCase().split( ' ' ).join( '-' );
        const vehicleEnds = this.droneStartIp + this.droneCount * 2 + 1;
        const px4Ip = this.dronePrefixIp + px4Ends.toString();
        const vehicleIp = this.dronePrefixIp + vehicleEnds.toString();
        const px4Name = 'px4-' + this.droneCount.toString();

        this._addService( px4Name, new Px4( px4Ip, this.simulatorIp ) );
        this._addService( 'vehicle-mavlink-' + this.droneCount.toString(), new VehicleMavLink(
            vehicleName,
            vehicleIp,
            px4Name,
            px4Ip,
            this.fms_ip
        ) );

        this.droneCount++;
    }

    toYML() {
        return YAML.stringify( {
            version: this.version,
            networks: this.networks,
            services: this.services
        } );
    }
}


module.exports = DockerCompose;
