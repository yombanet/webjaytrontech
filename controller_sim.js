const fetch = require('node-fetch'); // npm i node-fetch@2
const { v4: uuidv4 } = require('uuid');

if (process.argv.length < 3) {
  console.log('Usage: node controller_sim.js <deviceId>');
  process.exit(1);
}
const deviceId = process.argv[2];
const API = 'http://localhost:3001/api';

let valveState = 'closed';
let simulatedFuel = 78; // percent

async function sendTelemetry(rfid) {
  const body = { fuelLevel: simulatedFuel, valveState, rfid };
  await fetch(`${API}/controller/${deviceId}/telemetry`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
}

async function pollCommands() {
  const res = await fetch(`${API}/controller/${deviceId}/commands`);
  const cmds = await res.json();
  for (const c of cmds) {
    console.log('Received command', c);
    if (c.cmd === 'open') valveState = 'open';
    if (c.cmd === 'close') valveState = 'closed';
    // log local action and report to server
    await sendTelemetry(null);
  }
}

async function loop() {
  // random RFID scan occasionally
  if (Math.random() < 0.15) {
    const fakeRfid = 'RFID-' + Math.floor(Math.random()*1000);
    console.log('Simulate RFID', fakeRfid);
    await sendTelemetry(fakeRfid);
  } else {
    await sendTelemetry(null);
  }
  // slowly change fuel
  simulatedFuel = Math.max(0, simulatedFuel - (Math.random() * 0.2));
  await pollCommands();
}

console.log('Starting controller simulator for', deviceId);
setInterval(loop, 3000);
loop();