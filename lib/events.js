// Add events design pattern to a class by inheriting from the Events class
class Events {
    constructor() {
        this._listeners = {};
        this._listeningTo = [];
    }

    // Listens to one or multiple events on the specified object that implements Events
    // ex:
    // obj.listenTo( target, 'update', () => console.log( 'on update' ) );
    // obj.listenTo( target, {
    //   'update': () => console.log( 'on update' ),
    //   'connect': () => console.log( 'on connect' )
    // } );
    listenTo( target, event, cb ) {
        if ( event && target ) {
            if ( cb ) {
                this._listenTo( target, event, cb );
            } else {
                for ( var key in event ) {
                    cb = event[ key ];

                    if ( typeof cb === 'string' ) {
                        cb = this[ cb ];
                    }

                    if ( typeof cb === 'function' ) {
                        this._listenTo( target, key, cb );
                    } else {
                        throw new Error( 'bindEvents: Callback is not a function' );
                    }
                }
            }
        }
    }

    // Stop listening:
    // If called with no arguments it stops listening to all events
    // If called with first argument it stops listening to all events
    //     triggered by the specified object
    // If called with first two arguments it stops listening to all events
    //     of the given type triggered by the specified object
    // If all arguments are passed it removes a single listener
    //     that matches all arguments
    stopListening( target, event, cb ) {
        var data;
        if ( !this._listeningTo ) return;
        for ( var i = 0, l = this._listeningTo.length; i < l; i++ ) {
            data = this._listeningTo[ i ];
            if (
                ( !target || data[ 0 ] === target ) &&
                ( !event || data[ 1 ] === event ) &&
                ( !cb || data[ 2 ] === cb )
            ) {
                data[ 0 ].off( data[ 1 ], data[ 2 ], this );
            }
        }
    }

    // Adds a listener, use listenTo instead when possible
    // leaving listeners when disposing of an object can cause
    // momory leaks, calling stopListening allows to remove all
    // listeners attached using the listenTo method
    // ex:
    //   target.on( 'event', () => { console.log( 'on event' ); } )
    // prefer:
    //   obj.listenTo( target, 'event', () => { console.log( 'on event' ); } )
    on( event, cb, ctx ) {
        var obj = { fn: cb, ctx: ctx };

        if ( typeof cb !== 'function' ) {
            throw new Error( 'callback is not a function' );
        }

        if ( !this._listeners[ event ] ) {
            this._listeners[ event ] = [ obj ];
        } else {
            this._listeners[ event ].push( obj );
        }
    }

    // Removes a listener, use stopListening instead when possible
    // using listenTo / stopListening removes the need to keep track
    // of subscribed events
    // ex:
    //   let onEvent = () => { console.log( 'on event' ); };
    //   target.on( 'event', onEvent )
    //   target.off( 'event', onEvent )
    // prefer:
    //   obj.listenTo( target, 'event', () => { console.log( 'on event' ); } );
    //   obj.stopListening();
    //
    // where obj is another object that inherits from Events
    off( event, cb, ctx ) {
        var listeners, listener, i;

        if ( cb === undefined ) {
            this._listeners[ event ] = null;
        } else {
            listeners = this._listeners[ event ];

            if ( listeners && listeners.length ) {
                i = listeners.length;

                while ( i-- ) {
                    listener = listeners[ i ];
                    if ( listener.fn === cb && ( !ctx || listener.ctx === ctx ) ) {
                        listeners.splice( i, 1 );
                    }
                }
            }
        }
    }

    // Triggers all listeners that are bound to the specified event
    // on this object, data is passed as the first argument to
    // the listeners
    trigger( event, data ) {
        var listeners, listener;

        listeners = this._listeners[ event ];

        if ( listeners ) {
            for ( var i = 0, l = listeners.length; i < l; i++ ) {
                listener = listeners[ i ];
                listener.fn.call( listener.ctx || this, data );
            }
        }
    }

    // If obj triggers an event of the specified type the current
    // object triggers the same event, optionnally transforming the
    // data with the map function
    forward( obj, event, map ) {
        this.listenTo( obj, event, ( data ) => {
            if ( typeof map === 'function' ) {
                data = map( data );
            }

            this.trigger( event, data );
        } );
    }

    // Listens to an event on the specified object that implements Events
    // should not be called directly
    _listenTo( target, event, cb ) {
        if ( typeof event === 'string' && typeof cb === 'function' ) {
            target.on( event, cb, this );
            this._listeningTo.push( [ target, event, cb ] );
        }
    }

    // Cleans up all references to this object for garbage collection
    dispose() {
        this.stopListening();
    }
}

module.exports = Events;
