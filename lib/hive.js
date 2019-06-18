const WebSocket = require('isomorphic-ws');
const Vehicle = require('./vehicle');
const Events = require('./events');
const log = require('./log');
const Message = require('./message');

// Hive is the fleet management system
class Hive extends Events {
    constructor( url ) {
        super();
        this.url = url;
        this.vehicles = {};
        this.telemetry = {};
        this.requests = {};
        this.counter = 0;
        this.connected = false;
        this.queue = [];
    }

    connect() {
        this.disconnect();

        return new Promise(( resolve, reject ) => {
            this._ws = new WebSocket( this.url );

            this.on( 'connected', resolve );
            this.on( 'error', reject );

            this._ws.onopen = this._onOpen.bind( this );
            this._ws.onerror = this._onError.bind( this );
            this._ws.onclose = this._onClose.bind( this );
            this._ws.onmessage = this._onMessage.bind( this );
        });
    }

    disconnect() {
        if ( this._ws ) {
            this._ws.close();
            this._ws = null;
        }
    }

    vehicle( id ) {
        let vehicle = new Vehicle( id, this );

        let info = this.vehicles[ id ];
        if ( info ) {
            vehicle.setInfo( info );
        }

        let telemetry = this.telemetry[ id ];
        if ( telemetry ) {
            vehicle.setPosition( telemetry.position );
            vehicle.setBattery( telemetry.battery );
        }

        return vehicle;
    }

    sendRequest( type, data, timeout ) {
        var msg, err;

        if ( typeof data === 'number' ) {
            timeout = data;
            data = undefined;
        }

        msg = new Message( 'req', type, data );

        let req = this._registerRequest( msg, timeout || 20000 );

        err = this._send( msg );
        if ( err ) {
            log.error( 'send error', err );
            req.reject( err );
        }

        return req.promise;
    }

    sendUpdate( type, data ) {
        let msg = new Message( 'upd', type, data );
        return this._send( msg );
    }

    uniqueId() {
        return '' + this.counter++;
    }

    _registerRequest( msg, timeout ) {
        let id = msg.id;

        let req = {
            promise: null,
            resolve: null,
            reject: null,
            timer: null
        };

        req.promise = new Promise( ( resolve, reject ) => {
            let clear = () => {
                clearTimeout( req.timer );
                delete this.requests[ id ];
            }

            req.resolve = ( data ) => {
                clear();
                resolve( data );
            };

            req.reject = ( err ) => {
                clear();
                reject( err );
            };
        } );

        req.timer = setTimeout( function () {
            req.reject( new Error( 'timeout' ) );
        }, timeout );

        this.requests[ id ] = req;
        return req;
    }

    _request( id ) {
        return this.requests[ id ] || {
            resolve: () => {},
            reject: () => {}
        };
    }

    //_rejectRequest( id, err ) {
    //    let req = this.requests[ id ];
    //    if ( req ) {
    //        clearTimeout( req.timer );
    //        delete this.requests[ id ];
    //        req.reject( err );
    //    }
    //}

    _send( msg ) {
        if ( this._ws && this.connected ) {
            try {
                this._ws.send( msg.toString() );
            } catch ( error ) {
                return error;
            }
        } else {
            this.queue.push( msg );
        }
    }

    _onOpen() {
        this.connected = true;
        this._flushQueue();
        this.trigger( 'connected' );
    }

    _onError( err ) {
        this.trigger( 'error', err );
    }

    _onClose() {
        this.trigger( 'disconnected' );
    }

    _onMessage( e ) {
        let msg = Message.parse( e.data );
        this.trigger( 'message', msg );

        if ( msg && msg.type ) {
            switch ( msg.type ) {
            case 'login':
                console.log( msg.data );
                break;
            case 'vehicles':
                this._onVehiclesUpdated( msg );
                break;
            case 'telemetry':
                this._onTelemetryUpdated( msg );
                break;
            case 'reply':
                this._onReplyMessage( msg );
                break;
            case 'error':
                this._onErrorMessage( msg );
                break;
            case 'platform:status':
                // ignore
                break;
            case 'channel:message':
                this.trigger(msg.data.channelID, msg.data.message);
                break;
            default:
                log.warn( 'Unknow message type:', msg.type );
                console.dir( msg, { depth: 100 } );
            }
        }
    }

    _onReplyMessage( msg ) {
        if ( msg.data.id ) {
            if ( msg.data.error ) {
                this._request( msg.data.id )
                    .reject( new Error( msg.data.error ) );
            } else {
                this._request( msg.data.id )
                    .resolve( msg.data.result );
            }
        }
    }

    _onErrorMessage( msg ) {
        this.trigger( 'error', msg );
    }

    _onVehiclesUpdated( msg ) {
        this.vehicles = msg.data;
        this.trigger( 'vehicles', this.vehicles );
    }

    _onTelemetryUpdated( msg ) {
        this.telemetry = msg.data;
        this.trigger( 'telemetry', this.telemetry );
    }

    _flushQueue() {
        for ( let msg of this.queue ) {
            this._send( msg );
        }
    }
}

module.exports = Hive;
