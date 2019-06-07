const { Hive } = require('volons');

async function main() {
    let hive = new Hive('ws://localhost:8081/admin');
    await hive.connect();

    console.log('connected to hive');

    let vehicle = hive.vehicle('dev');
    await vehicle.connect();

    console.log('connected to vehicle');

    console.log('takeoff');
    await vehicle.takeoff();
    console.log('in air');
}

main().catch((err) => console.error(err));
