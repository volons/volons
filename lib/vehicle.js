const Events = require('./events');
const log = require('./log');

class Vehicle extends Events {
    constructor( id, hive ) {
        super();
        this.id = id;
        this.hive = hive;
        this.listenTo( this.hive, {
            'update:vehicles': ( vehicles ) => {
                if ( vehicles[ this.id ] ) {
                    this.setInfo( vehicles[ this.id ] );
                }
            },
            'update:positions': ( positions ) => {
                if ( positions[ this.id ] ) {
                    this.setPosition( positions[ this.id ] );
                }
            },
            [`vehicle:${ this.id }`]: ( msg ) => {
                this.onMessage( msg );
            }
        } );
    }

    setInfo( info ) {
        this.name = info.name;
        this.model = info.model;
        this.state = info.state;
    }

    setPosition( pos ) {
        this.lat = pos.lat;
        this.lon = pos.lon;
        this.alt = pos.alt;
        this.hdg = pos.hdg;
    }

    onMessage( msg ) {
        switch ( msg.type ) {
        case 'event:battery':
            this.trigger('battery', msg.data);
            break;
        default:
            log.warn( 'Unknow message type:', msg.type );
            console.dir( msg, { depth: 100 } );
        }
    }

    async connect() {
        return await this.hive.sendRequest( 'channel:open', {
            channelID: `vehicle:${ this.id }`
        } );
    }

    takeoff( alt ) {
        return this.request( 'takeoff', {
            alt: alt || 2
        } );
    }

    goto( lat, lon, relAlt ) {
        return this.request( 'goto', {
            lat: lat,
            lon: lon,
            relAlt: relAlt
        } );
    }

    land() {
        return this.request( 'land' );
    }

    request( type, data ) {
        return this.hive.sendRequest( 'channel:send', {
            channelID: `vehicle:${ this.id }`,
            message: {
                type: type,
                data: data
            }
        } );
    }
}

module.exports = Vehicle;
