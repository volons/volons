const { Hive } = require('volons');

async function main() {
    //let hive = new Hive('ws://10.31.253.160:8656/admin');
    let hive = new Hive('ws://localhost:8656/admin');
    await hive.connect();

    console.log('connected to hive');

    let vehicle = hive.vehicle('dev');
    await vehicle.connect();
    console.log('connected to vehicle');

    console.log('takeoff');
    await vehicle.takeoff();
    console.log('in air');


    const wp = [{lat: -35.364258, lon: 149.163263, relAlt: 30},
           {lat: -35.361879, lon: 149.161882, relAlt: 30},
           {lat: -35.361537, lon: 149.165635, relAlt: 30}];

    for ( let i = 0; i < wp.length; i++ ) {
        await vehicle.goto(wp[i].lat, wp[i].lon, wp[i].relAlt);
        console.log(`arrived at waypoint: ${ i }`);
    }

    console.log('returning home');
    await vehicle.rtl();

    console.log('landed');
}

main().catch((err) => console.error(err));
