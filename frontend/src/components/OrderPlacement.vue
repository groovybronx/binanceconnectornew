<template>
  <div class="order-placement">
    <h3>Place Test Order</h3>
    <div v-if="connectionStatus !== 'Connected'" class="status">
      {{ connectionStatus }}...
    </div>
    <div v-else>
      <div class="form-group">
        <label for="pair">Pair:</label>
        <input type="text" id="pair" v-model="orderData.pair" placeholder="e.g., BTCUSDT" />
      </div>
      <div class="form-group">
        <label for="side">Side:</label>
        <select id="side" v-model="orderData.side">
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </div>
      <div class="form-group">
        <label for="type">Type:</label>
        <select id="type" v-model="orderData.type">
          <option value="MARKET">Market</option>
          <option value="LIMIT">Limit</option>
        </select>
      </div>
      <div class="form-group" v-if="orderData.type === 'LIMIT'">
        <label for="price">Price:</label>
        <input type="number" id="price" v-model.number="orderData.price" step="0.01" />
      </div>
      <div class="form-group">
        <label for="quantity">Quantity:</label>
        <input type="number" id="quantity" v-model.number="orderData.quantity" step="0.000001" />
      </div>
      <button @click="placeOrder" :disabled="isLoading || !isFormValid">
        {{ isLoading ? 'Placing Order...' : 'Place Order' }}
      </button>
      <div v-if="orderStatusMessage" :class="statusClass">
        {{ orderStatusMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const orderData = ref({
  pair: 'BTCUSDT', // Default pair
  side: 'BUY', // Default side
  type: 'MARKET', // Default type
  price: null, // Only for LIMIT orders
  quantity: 0,
});

const isLoading = ref(false);
const orderStatusMessage = ref(null);
const isError = ref(false);
const connectionStatus = ref('Connecting');
const ws = ref(null);

const statusClass = computed(() => ({
  'status-message': true,
  'success': !isError.value,
  'error': isError.value,
}));

const isFormValid = computed(() => {
  return (
    orderData.value.pair &&
    orderData.value.side &&
    orderData.value.type &&
    orderData.value.quantity > 0 &&
    (orderData.value.type !== 'LIMIT' || orderData.value.price !== null)
  );
});

const placeOrder = async () => {
  orderStatusMessage.value = null;
  isError.value = false;
  isLoading.value = true;

  try {
    const response = await fetch('http://localhost:8080/api/place-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData.value),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    orderStatusMessage.value = result.message || 'Order placed successfully!';
    isError.value = false;
    // Reset form after successful order
    orderData.value.quantity = 0;
    orderData.value.price = null;
  } catch (err) {
    orderStatusMessage.value = err.message || 'An error occurred while placing the order.';
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const connectWebSocket = () => {
  const backendWsUrl = 'ws://localhost:8080';
  console.log(`OrderPlacement: Attempting to connect to WebSocket backend at ${backendWsUrl}`);
  ws.value = new WebSocket(backendWsUrl);

  ws.value.onopen = () => {
    console.log('OrderPlacement: WebSocket connection to backend established.');
    connectionStatus.value = 'Connected';
  };

  ws.value.onerror = (error) => {
    console.error('OrderPlacement: WebSocket Error:', error);
    connectionStatus.value = 'Error';
  };

  ws.value.onclose = (event) => {
    console.log(
      'OrderPlacement: WebSocket connection closed:',
      event.reason || `Code ${event.code}`
    );
    connectionStatus.value = `Closed (${event.code})`;
  };
};

onMounted(() => {
  connectWebSocket();
});

onUnmounted(() => {
  if (ws.value) {
    console.log('OrderPlacement: Closing WebSocket connection from frontend.');
    ws.value.close();
  }
});
</script>

<style scoped>
.order-placement {
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 8px;
  min-width: 300px;
  background-color: #ffffff;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 10px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input[type='text'],
input[type='number'],
select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.status-message {
  font-size: 0.9em;
  margin-top: 10px;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
}

.status-message.success {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}
.status {
  text-align: center;
  color: #888;
}
</style>
