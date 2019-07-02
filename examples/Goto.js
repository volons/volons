const { Hive } = require('volons');

async function main() {
    let hive = new Hive('ws://localhost:8656/admin');
    await hive.connect();

    console.log(' -- connected to hive');

    let vehicle = hive.vehicle('dev');
    await vehicle.connect();
    console.log(' -- connected to vehicle');

    let updState = null;
    hive.on('telemetry', data => {
        if (data.dev.status.armed !== updState) {
            if (data.dev.status.armed) {
                console.log('State: Armed!');
            } else {
                console.log('State: Disarmed');
            }
            updState = data.dev.status.armed;
        }
    });

    console.log('Command: takeoff');
    await vehicle.takeoff();
    console.log('State: In the Air');

    const wp = [
        { lat: -35.363607, lon: 149.16468, relAlt: 20 },
        { lat: -35.362887, lon: 149.164158, relAlt: 20 },
        { lat: -35.362081, lon: 149.164247, relAlt: 40 },
        { lat: -35.361888, lon: 149.16467, relAlt: 60 },
        { lat: -35.36206, lon: 149.165042, relAlt: 45 },
        { lat: -35.362184, lon: 149.165076, relAlt: 30 },
    ];

    for (let i = 0; i < wp.length; i++) {
        console.log(`Command: goto() #${i}`, wp[i]);
        await vehicle.goto(wp[i].lat, wp[i].lon, wp[i].relAlt);
        console.log(`State: Arrived at #${i}`);
    }

    console.log('Command: rtl()');
    await vehicle.rtl();
    console.log('State: Landing...');
}

main().catch(err => console.error(err));
