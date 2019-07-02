const { Hive } = require('volons');

const main = async function() {
    let hive = new Hive('ws://localhost:8656/admin');
    await hive.connect();
    console.log('connected to hive');

    // data store telemetries for all connected drones
    hive.on( 'telemetry', ( data ) => {
        Object.keys( data ).forEach( ( uav ) => {
            console.log( uav, data[ uav ] );
        } );
        // should print telemetry for 'dev' drone:
        // {
        //     status: { armed: true },
        //     position: {
        //         lat: -35.3628921,
        //         lon: 149.1641617,
        //         alt: 20.04,
        //         relAlt: 20.04,
        //         vx: 0,
        //         vy: 0,
        //         vz: 0,
        //         hdg: 329,
        //         timestamp: '0001-01-01T00:00:00Z'
        //     },
        //     battery: {
        //         voltage: 12.242,
        //         current: 25.34,
        //         percent: 89
        //     }
        // }
        // ... every 800ms
    } );
}

main().catch((err) => console.error(err));
