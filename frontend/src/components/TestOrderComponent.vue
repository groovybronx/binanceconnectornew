<template>
  <div class="test-order-container component-container rounded shadow gradient-background">
    <h2>Test Order</h2>
    <button @click="runTestOrder" :disabled="isRunning">
      {{ isRunning ? 'Running...' : 'Run Test Order' }}
    </button>
    <div v-if="isRunning" class="loading-indicator">
      <p>Running test order...</p>
    </div>
    <div v-if="output" class="output-container">
      <h3>Output:</h3>
      <pre>{{ output }}</pre>
    </div>
    <div v-if="error" class="error-container">
      <h3>Error:</h3>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TestOrderComponent',
  data() {
    return {
      isRunning: false,
      output: null,
      error: null,
    };
  },
  methods: {
    async runTestOrder() {
      this.isRunning = true;
      this.output = null;
      this.error = null;

      try {
        const orderData = {
          symbol: 'BTCUSDT',
          side: 'BUY',
          type: 'LIMIT',
          quantity: '0.001',
          price: '30000',
          newClientOrderId: `my_test_order_id_${Date.now()}`,
          newOrderRespType: 'ACK',
          recvWindow: 5000,
          timeInForce: 'GTC',
        };

        const response = await fetch('http://localhost:8080/api/test-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.output = JSON.stringify(data, null, 2);
      } catch (err) {
        this.error = JSON.stringify(err.message, null, 2);
      } finally {
        this.isRunning = false;
      }
    },
  },
};
</script>

<style scoped>
.test-order-container {
  border: 1px solid #ccc;
  padding: 20px;
  margin: 20px;
  border-radius: 5px;
}

.output-container,
.error-container {
  margin-top: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
}

.error-container {
  background-color: #ffe6e6;
}

.loading-indicator {
  margin-top: 10px;
}

pre {
  white-space: pre-wrap;
  font-family: monospace;
}
</style>
