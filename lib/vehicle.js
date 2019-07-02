const Events = require('./events');
const log = require('./log');
const utils = require('./utils');

var toto = 'su';

class Vehicle extends Events {
    constructor(id, hive) {
        super();
        this.id = id;
        this.hive = hive;
        this.listenTo(this.hive, {
            vehicles: vehicles => {
                if (vehicles[this.id]) {
                    this.setInfo(vehicles[this.id]);
                }
            },
            [`vehicle:${this.id}`]: msg => {
                this.onMessage(msg);
            },
        });
    }

    setInfo(info) {
        this.name = info.name;
        this.model = info.model;
        this.state = info.state;
    }

    setStatus(status) {
        this.armed = status.armed;
    }

    setTelemetry(data) {
        if (data.position) {
            this.setPosition(data.position);
        }
        if (data.battery) {
            this.setBattery(data.battery);
        }
    }

    setBattery(batt) {
        this.current = batt.current;
        this.voltage = batt.voltage;
        this.percent = batt.percent;
    }

    setPosition(pos) {
        this.lat = pos.lat;
        this.lon = pos.lon;
        this.alt = pos.alt;
        this.relAlt = pos.relAlt;
        this.hdg = pos.hdg;
    }

    onMessage(msg) {
        switch (msg.type) {
            case 'battery':
                this.setBattery(msg.data);
                break;
            case 'position':
                this.setPosition(msg.data);
                break;
            case 'status':
                this.setStatus(msg.data);
                break;
        }

        this.trigger(msg.type, msg.data);
    }

    async connect() {
        return await this.hive.sendRequest('channel:open', {
            channelID: `vehicle:${this.id}`,
        });
    }

    async takeoff(relAlt) {
        relAlt = relAlt || 2;

        await this.request('takeoff', {
            relAlt: relAlt,
        });

        return new Promise(resolve => {
            const listener = pos => {
                if (pos.relAlt >= relAlt - 0.5) {
                    this.stopListening(this, 'position', listener);
                    resolve();
                }
            };

            this.listenTo(this, 'position', listener);
        });
    }

    async goto(lat, lon, relAlt) {
        const dest = {
            lat: lat,
            lon: lon,
            relAlt: relAlt,
        };

        await this.request('goto', dest);

        return new Promise(resolve => {
            const listener = pos => {
                if (utils.distance(pos, dest) <= 1) {
                    this.stopListening(this, 'position', listener);
                    resolve();
                }
            };

            this.listenTo(this, 'position', listener);
        });
    }

    rtl() {
        return this.request('rtl');
    }

    land() {
        return this.request('land');
    }

    request(type, data) {
        return this.hive.sendRequest('channel:send', {
            channelID: `vehicle:${this.id}`,
            message: {
                type: type,
                data: data,
            },
        });
    }
}

module.exports = Vehicle;
