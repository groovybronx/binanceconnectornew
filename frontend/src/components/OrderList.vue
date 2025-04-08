<template>
  <div class="order-list component-container rounded shadow gradient-background">
    <h3>Order List</h3>
    <div class="filter-container">
      <label for="order-filter">Filter:</label>
      <select id="order-filter" v-model="orderFilter">
        <option value="all">All Orders</option>
        <option value="open">Open Orders</option>
      </select>
    </div>
    <div class="symbol-container">
      <label for="symbol-select">Symbol:</label>
      <select id="symbol-select" v-model="selectedSymbol">
        <option value="XRPUSDT">XRPUSDT</option>
        <option value="BTCUSDT">BTCUSDT</option>
        <!-- Add more symbols here -->
      </select>
    </div>
    <div v-if="isLoading" class="loading-indicator">Loading orders...</div>
    <div v-else-if="error" class="error-message rounded">Error: {{ error }}</div>
    <div v-else class="order-list-container">
      <table class="order-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Order ID</th>
            <th>Client Order ID</th>
            <th>Side</th>
            <th>Type</th>
            <th>Status</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.orderId">
            <td>{{ order.symbol }}</td>
            <td>{{ order.orderId }}</td>
            <td>{{ order.clientOrderId }}</td>
            <td>{{ order.side }}</td>
            <td>{{ order.type }}</td>
            <td :class="getOrderStatusClass(order.status)">{{ order.status }}</td>
            <td>{{ order.price }}</td>
            <td>{{ order.origQty }}</td>
            <td>{{ new Date(order.time).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useWebSocketStore } from '../stores/webSocket';

const webSocketStore = useWebSocketStore();

const orders = ref([]);
const isLoading = ref(false);
const error = ref(null);
const orderFilter = ref('all');
const selectedSymbol = ref('XRPUSDT');

const fetchOrders = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const apiUrl = `http://localhost:8080/api/orders?symbol=${selectedSymbol.value}`;
    console.log('OrderList: Fetching orders from:', apiUrl);
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    orders.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const filteredOrders = computed(() => {
  if (orderFilter.value === 'open') {
    return orders.value.filter(order => order.status !== 'FILLED' && order.status !== 'CANCELED' && order.status !== 'REJECTED' && order.status !== 'EXPIRED');
  } else {
    return orders.value;
  }
});

const getOrderStatusClass = (status) => {
  switch (status) {
    case 'NEW':
    case 'PARTIALLY_FILLED':
      return 'status-pending';
    case 'FILLED':
      return 'status-executed';
    case 'CANCELED':
    case 'REJECTED':
    case 'EXPIRED':
      return 'status-canceled';
    default:
      return '';
  }
};

watch([orderFilter, selectedSymbol, () => webSocketStore.currentPair], () => {
  console.log('Order filter changed to:', orderFilter.value);
  fetchOrders();
});

onMounted(() => {
  selectedSymbol.value = webSocketStore.currentPair;
  fetchOrders();
});
</script>

<style scoped>
.order-list {
  width: 100%;
  overflow-x: auto;
}

.order-list-container {
  width: 100%;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background-color: var(--dark-background);
}

.order-table th,
.order-table td {
  border: 1px solid var(--dark-border);
  padding: 8px;
  text-align: left;
}

.order-table th {
  background-color: var(--darker-background);
}

.loading-indicator {
  margin-top: 10px;
}

.error-message {
  margin-top: 10px;
  color: red;
}

.filter-container {
  margin-bottom: 10px;
}

.status-pending {
  color: orange;
}

.status-executed {
  color: green;
}

.status-canceled {
  color: red;
}
</style>
