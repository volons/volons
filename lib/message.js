import {log} from './log';

export class Message {
    static parse( data ) {
        let msg;

        try {
            msg = JSON.parse( data ) || {};
        } catch ( err ) {
            log.warn( 'Could not parse message', err );
            return null;
        }

        return new Message( msg.verb, msg.type, msg.data, msg.id );
    }

    static uniqueID() {
        return Math.random().toString( 36 ).substr( 2 );
    }

    constructor( verb, type, data, id ) {
        this.verb = verb || 'upd';
        this.type = type || '';
        this.data = data || {};
        this.id = id || Message.uniqueID();
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            data: this.data,
            verb: this.verb
        };
    }

    toString() {
        return JSON.stringify( this );
    }
}
