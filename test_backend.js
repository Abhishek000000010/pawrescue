const fetch = require('node-fetch'); // wait node 22 has built in fetch
async function run() {
  const token = 'we dont have a valid token'; // Wait, the route is protected!
  console.log('Cannot test protected route without a token.');
}
run();
