<template>
  <div class="order-placement component-container rounded shadow gradient-background">
    <h3>Order Placement</h3>
    <div class="form-group">
      <label for="pair">Pair:</label>
      <input type="text" id="pair" :value="currentPair" readonly />
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
      <input type="number" id="price" v-model="orderData.price" />
    </div>
    <div class="form-group">
      <label for="quantity">Quantity:</label>
      <input type="number" id="quantity" v-model="orderData.quantity" />
    </div>
    <button @click="placeOrder">Place Order</button>
    <div v-if="orderResponse" class="order-response rounded">
      <p>Order Response:</p>
      <pre>{{ orderResponse }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const currentPair = ref('BTCUSDT'); // Valeur par défaut
const orderData = ref({
  side: 'BUY',
  type: 'MARKET',
  price: null,
  quantity: null,
});
const orderResponse = ref(null);
let socket = null;

const placeOrder = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/place-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...orderData.value }),
    });

    if (!response.ok) {
      const result = await response.json();
      console.error('OrderPlacement: Failed to place order:', result.error || `HTTP error! status: ${response.status}`);
      return;
    }

    const result = await response.json();
    orderResponse.value = JSON.stringify(result, null, 2);
    console.log('OrderPlacement: Order placed successfully:', result);
  } catch (error) {
    console.error('OrderPlacement: Error placing order:', error);
  }
};

onMounted(() => {
  socket = new WebSocket('ws://localhost:8080');

  socket.addEventListener('open', () => {
    console.log('OrderPlacement: WebSocket connection opened');
  });

  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'config') {
      currentPair.value = data.pair;
      console.log('OrderPlacement: Paire mise à jour:', currentPair.value);
    }
  });

  socket.addEventListener('close', () => {
    console.log('OrderPlacement: WebSocket connection closed');
  });

  socket.addEventListener('error', (error) => {
    console.error('OrderPlacement: WebSocket error:', error);
  });
});

onUnmounted(() => {
  if (socket) {
    socket.close();
  }
});
</script>

<style scoped>
.order-placement {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-placement input,
.order-placement select {
  background-color: var(--dark-background);
}

.order-response {
  background-color: var(--dark-background);
  border: 1px solid var(--dark-border);
  padding: 10px;
  font-size: 0.9em;
  white-space: pre-wrap;
}
</style>
