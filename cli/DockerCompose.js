// Volons DockerCompose.js
// =======================
// This class map docker-compose structure to 
// store services, network and configuration and
// generate YML docker-compose file into volons npm global directory
//
// TODO:
// - upload images on dockerhub and update DBP ( Docker Build Path ).
// - check concurrential binding port when running 2 or more docker-compose at the same time.
// - check network services properties options

const YAML = require( 'json2yaml' );

const _DOCKER_HUB_IMAGE_VEHICLE_MAVLINK_ = 'volons/vehicle-mavlink';
const _DOCKER_HUB_IMAGE_SIMULATOR_ = 'volons/simulator';
const _DOCKER_HUB_IMAGE_HIVE_ = 'volons/hive';

const _DEFAULT_GMAP_API_KEY_ = '__OBSOLETE__';

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
    _addService( name, service ) { this.services[ name ] = service; }

    _getService( serviceName ) { return this.services[ serviceName ] ? this.services[ serviceName ] : null; }

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
        service.environment.forEach(  ( env ) => {
            if ( env.split( '=' )[ 0 ] === key ) {
                // update value
                env = `${ key }=${ value }`;
                updateEnv = true;
                return;
            }
        } );
        // new env
        if ( !updateEnv ) {
            service.environment.push( `${ key }=${ value }` );
        }
    }
    // end privates methods

    init( token ) {
        this._addService( 'fms', new Hive( this.fmsIp, token ) );
        this._addService( 'simulator', new Simulator( this.simulatorIp ) );
    }

    setDefaultHomePosition( latitude, longitude, altitude ) {
        this._setEnv( 'simulator', 'PX4_HOME_LAT', latitude );
        this._setEnv( 'simulator', 'PX4_HOME_LON', longitude );
        this._setEnv( 'simulator', 'PX4_HOME_ALT', altitude );
    }

    setDefaultGoogleMapAPIkey() {
        this.useDefaultGmapAPIKey = true;
        this._setEnv( 'fms', 'GMAP_API_KEY', _DEFAULT_GMAP_API_KEY_ );
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
        const px4Ends = this.droneStartIp + ( this.droneCount * 2 );
        const vehicleName = name.trim().toLowerCase().split( ' ' ).join( '-' );
        const vehicleEnds = this.droneStartIp + ( ( this.droneCount * 2 ) + 1 );
        const px4Ip = this.dronePrefixIp + px4Ends.toString();
        const vehicleIp = this.dronePrefixIp + vehicleEnds.toString();
        const px4Name = 'px4-' + this.droneCount.toString();

        this._addService( px4Name, new Px4(
            px4Ip,
            this.simulatorIp ) );
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

class ContainerService {
    constructor( ip, env, image ) {
        this.networks = {
            volons: {
                ipv4_address: ip
            }
        };
        if ( env ) {
            this.environment = env;
        }
        if ( image ) {
            this.image = image;
        }
    }
}

class VehicleMavLink extends ContainerService {
    constructor( vehicleName, vehicleIp, px4Name, px4Ip, fmsIp ) {
        super( vehicleIp, {
            FMS_IP: fmsIp,
            VEHICLE_NAME: vehicleName
        }, _DOCKER_HUB_IMAGE_VEHICLE_MAVLINK_ );
        this.depends_on = [ px4Name ];
    }
}

class Px4 extends ContainerService {
    constructor( px4Ip, simulatorIp ) {
        super( px4Ip, {
            SIMULATOR_IP: simulatorIp
        },  _DOCKER_HUB_SIMULATOR_ );
        this.depends_on = [ 'simulator' ];
    }
}

class Simulator extends ContainerService {
    constructor( ip ) {
        super( ip );
        this.image = 'volons/gazebo';
        this.depends_on = [ 'fms' ];
    }
}

class Hive extends ContainerService {
    constructor( ip, token ) {
        super( ip, [ `ADMIN_TOKEN=${ token }` ] );
        //this.ports = [ '8081:8081' ];
        this.image = _DOCKER_HUB_IMAGE_HIVE_;
    }
}

module.exports = DockerCompose;
