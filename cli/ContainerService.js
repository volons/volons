const _DOCKER_HUB_IMAGE_VEHICLE_MAVLINK_ = 'volons/vehicle-mavlink';
const _DOCKER_HUB_IMAGE_SIMULATOR_ = 'volons/simulator';
const _DOCKER_HUB_IMAGE_HIVE_ = 'volons/hive';

class ContainerService {
    constructor(ip, env, image) {
        this.networks = {
            volons: {
                ipv4_address: ip,
            },
        };
        if (env) {
            this.environment = env;
        }
        if (image) {
            this.image = image;
        }
    }
}

class VehicleMAVLink extends ContainerService {
    constructor(vehicleName, vehicleIp, px4Name, px4Ip, fmsIp) {
        super(
            vehicleIp,
            {
                FMS_IP: fmsIp,
                VEHICLE_NAME: vehicleName,
            },
            _DOCKER_HUB_IMAGE_VEHICLE_MAVLINK_
        );
        this.depends_on = [px4Name];
    }
}

class Simulator extends ContainerService {
    constructor(ip) {
        super(ip, {}, _DOCKER_HUB_IMAGE_SIMULATOR_);
        this.depends_on = ['hive'];
    }
}

class Hive extends ContainerService {
    constructor(ip, token) {
        super(ip, [`ADMIN_TOKEN=${token}`]);
        //this.ports = [ '8081:8081' ];
        this.image = _DOCKER_HUB_IMAGE_HIVE_;
    }
}

module.exports = { VehicleMAVLink, Simulator, Hive };
