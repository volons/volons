const _DOCKER_HUB_IMAGE_VEHICLE_MAVLINK_ = 'volons/vehicle-mavlink';
const _DOCKER_HUB_IMAGE_HIVE_ = 'volons/hive';

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
        }, _DOCKER_HUB_SIMULATOR_ );
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

module.exports = { VehicleMavLink, Px4, Simulator, Hive };
