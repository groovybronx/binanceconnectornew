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
        <option value="LIMIT_MAKER">Limit Maker</option>
      </select>
    </div>
    <div class="form-group" v-if="['LIMIT', 'LIMIT_MAKER'].includes(orderData.type)">
      <label for="price">Price:</label>
      <input type="number" id="price" v-model="orderData.price" />
    </div>
    <div class="form-group">
      <label for="quantity">Quantity:</label>
      <input type="number" id="quantity" v-model="orderData.quantity" />
    </div>
    <div class="form-group" v-if="orderData.type === 'LIMIT'">
      <label for="timeInForce">Time In Force:</label>
      <select id="timeInForce" v-model="orderData.timeInForce">
        <option value="GTC">GTC</option>
        <option value="IOC">IOC</option>
        <option value="FOK">FOK</option>
      </select>
    </div>
    <button @click="placeOrder" :disabled="isRunning">
      {{ isRunning ? 'Placing...' : 'Place Order' }}
    </button>
    <div v-if="orderResponse" class="order-response rounded">
      <p>Order Response:</p>
      <pre>{{ orderResponse }}</pre>
    </div>
    <div v-if="errorMessage" class="error-message rounded">
      <p>Error:</p>
      <pre>{{ errorMessage }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useWebSocketStore } from '../stores/webSocket';
import { useOrderListStore } from '../stores/orderList';

const webSocketStore = useWebSocketStore();

const orderData = ref({
  symbol: webSocketStore.currentPair,
  side: 'BUY',
  type: 'MARKET',
  price: null,
  quantity: null,
  newClientOrderId: `my_order_id_${Date.now()}`,
  newOrderRespType: 'ACK',
  recvWindow: 5000,
  timeInForce: 'GTC',
});
const orderResponse = ref(null);
const errorMessage = ref(null);
const isRunning = ref(false);

const currentPair = computed(() => webSocketStore.currentPair);

const placeOrder = async () => {
  isRunning.value = true;
  errorMessage.value = null;
  try {
    const orderDataToSend = { ...orderData.value };
    if (orderDataToSend.type === 'MARKET') {
      delete orderDataToSend.timeInForce;
      delete orderDataToSend.price; // Remove price for market orders
    }

    const response = await fetch('http://localhost:8080/api/place-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderDataToSend),
    });

    if (!response.ok) {
      const result = await response.json();
      errorMessage.value = result.error || `HTTP error! status: ${response.status}`;
      console.error('OrderPlacement: Failed to place order:', errorMessage.value);
      return;
    }

    const result = await response.json();
    orderResponse.value = JSON.stringify(result, null, 2);
    console.log('OrderPlacement: Order placed successfully:', result);
    // Refresh orders in OrderList
    const { fetchOpenOrders, fetchOrderHistory } = useOrderListStore();
    fetchOpenOrders();
    fetchOrderHistory();
  } catch (error) {
    errorMessage.value = error.message;
    console.error('OrderPlacement: Error placing order:', error);
  } finally {
    isRunning.value = false;
  }
};

watch(currentPair, (newPair) => {
  orderData.value.symbol = newPair;
});

onUnmounted(() => {
  // No need to disconnect WebSocket here, handled by the store
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
.error-message {
  background-color: var(--dark-background);
  border: 1px solid red;
  padding: 10px;
  font-size: 0.9em;
  white-space: pre-wrap;
  color: red;
}
</style>
