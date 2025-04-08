// testOrder.js
const { exec } = require('child_process');

/**
 * @function testOrder
 * @description Sends a test order request to the /api/test-order endpoint using curl.
 */
function testOrder() {
  const curlCommand = `curl -X POST -H "Content-Type: application/json" -d '{
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "quantity": "0.001",
    "price": "30000"
  }' http://localhost:8080/api/test-order`;

  console.log('--------------------------------------------------');
  console.log('testOrder.js: Starting test order process...');
  console.log('testOrder.js: Sending test order request...');
  console.log('testOrder.js: Command:', curlCommand);
  console.log('--------------------------------------------------');

  exec(curlCommand, (error, stdout, stderr) => {
    console.log('--------------------------------------------------');
    console.log('testOrder.js: Curl command execution completed.');

    if (error) {
      console.error('testOrder.js: Error executing curl command:');
      console.error(error);
      console.log('--------------------------------------------------');
      return;
    }

    if (stderr) {
      console.error('testOrder.js: Curl command stderr:');
      console.error(stderr);
      console.log('--------------------------------------------------');
      return;
    }

    console.log('testOrder.js: Curl command stdout (Server Response):');
    console.log(stdout);
    console.log('testOrder.js: Test order process completed successfully.');
    console.log('--------------------------------------------------');
  });
}

// Run the test order function
testOrder();
