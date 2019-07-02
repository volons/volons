const { Hive } = require('volons');

async function main() {
    let hive = new Hive('ws://localhost:8656/admin');
    await hive.connect();

    console.log('connected to hive');

    let vehicle = hive.vehicle('dev');
    await vehicle.connect();
    console.log('connected to vehicle');

    console.log('takeoff');
    await vehicle.takeoff();
    console.log('in air');

    const wp = [
        { lat: -35.363607, lon: 149.16468, relAlt: 20 },
        { lat: -35.362887, lon: 149.164158, relAlt: 20 },
        { lat: -35.362081, lon: 149.164247, relAlt: 40 },
        { lat: -35.361888, lon: 149.16467, relAlt: 60 },
        { lat: -35.36206, lon: 149.165042, relAlt: 45 },
        { lat: -35.362184, lon: 149.165076, relAlt: 30 },
    ];

    for (let i = 0; i < wp.length; i++) {
        await vehicle.goto(wp[i].lat, wp[i].lon, wp[i].relAlt);
        console.log(`arrived at waypoint: ${i}`);
    }

    console.log('returning home');
    await vehicle.rtl();

    console.log('landed');
}

main().catch(err => console.error(err));
