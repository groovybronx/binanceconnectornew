<template>
  <div class="order-list component-container rounded shadow gradient-background">
    <h3>Order List</h3>
    <div class="tab-container">
      <button :class="{ active: activeTab === 'openOrders' }" @click="activeTab = 'openOrders'">Open Orders</button>
      <button :class="{ active: activeTab === 'orderHistory' }" @click="activeTab = 'orderHistory'">Order History</button>
      <button :class="{ active: activeTab === 'tradeHistory' }" @click="activeTab = 'tradeHistory'">Trade History</button>
    </div>
    <div v-if="isLoading" class="loading-indicator">Loading...</div>
    <div v-else-if="error" class="error-message rounded">Error: {{ error }}</div>
    <div v-else class="order-list-container">
      <table class="order-table">
        <thead>
          <tr v-if="activeTab === 'openOrders'">
            <th>Date</th>
            <th>Type</th>
            <th>Direction</th>
            <th>Price</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
          <tr v-if="activeTab === 'orderHistory'">
            <th>Date</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Type</th>
            <th>Status</th>
            <th>Price</th>
            <th>Quantity</th>
          </tr>
          <tr v-if="activeTab === 'tradeHistory'">
            <th>Date</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Fee</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tableData" :key="item.id">
            <template v-if="activeTab === 'openOrders'">
              <td>{{ new Date(item.time).toLocaleString() }}</td>
              <td>{{ item.type }}</td>
              <td>{{ item.side }}</td>
              <td>{{ item.price }}</td>
              <td>{{ item.origQty }}</td>
              <td>
                <button v-if="['NEW', 'PARTIALLY_FILLED'].includes(item.status)" @click="cancelOrder(item)">
                  Cancel
                </button>
              </td>
            </template>
            <template v-if="activeTab === 'orderHistory'">
              <td>{{ new Date(item.time).toLocaleString() }}</td>
              <td>{{ item.symbol }}</td>
              <td>{{ item.side }}</td>
              <td>{{ item.type }}</td>
              <td>{{ item.status }}</td>
              <td>{{ item.price }}</td>
              <td>{{ item.origQty }}</td>
            </template>
            <template v-if="activeTab === 'tradeHistory'">
              <td>{{ new Date(item.time).toLocaleString() }}</td>
              <td>{{ item.symbol }}</td>
              <td>{{ item.side }}</td>
              <td>{{ item.price }}</td>
              <td>{{ item.origQty }}</td>
              <td>{{ item.fee }}</td>
            </template>
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
const positions = ref([]);
const activeTab = ref('openOrders');
const openOrders = ref([]);
const orderHistory = ref([]);
const tradeHistory = ref([]);

const fetchOpenOrders = async () => {
  isLoading.value = true;
  error.value = null;
  console.log('OrderList: fetchOpenOrders called with symbol:', webSocketStore.currentPair);
  try {
    const apiUrl = `http://localhost:8080/api/orders?symbol=${webSocketStore.currentPair}`;
    console.log('OrderList: Fetching open orders from:', apiUrl);
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
    console.log('OrderList: fetchOpenOrders response', response);

    const data = await response.json();
    openOrders.value = data.filter(order => order.status !== 'FILLED' && order.status !== 'CANCELED' && order.status !== 'REJECTED' && order.status !== 'EXPIRED');
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const fetchOrderHistory = async () => {
    isLoading.value = true;
    error.value = null;
    console.log('OrderList: fetchOrderHistory called with symbol:', webSocketStore.currentPair);
    try {
      const apiUrl = `http://localhost:8080/api/all-orders?symbol=${webSocketStore.currentPair}`;
      console.log('OrderList: Fetching order history from:', apiUrl);
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
      orderHistory.value = data.reverse();
    } catch (err) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

const fetchTradeHistory = async () => {
  // TODO: Implement trade history fetching logic
  tradeHistory.value = []; // Placeholder
};

const fetchPositions = async () => {
  try {
    const apiUrl = `http://localhost:8080/api/positions`;
    console.log('OrderList: Fetching positions from:', apiUrl);
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
    positions.value = data;
  } catch (err) {
    console.error('OrderList: Error fetching positions:', err);
  }
};

const getOrderStatusClass = (status) => {
  switch (status) {
    case 'NEW':
    case 'PARTIALLY_FILLED':
      return 'status-pending';
    case 'FILLED':
      return 'status-executed';
    case 'CANCELED':
      return 'status-canceled';
    case 'REJECTED':
      return 'status-rejected';
    case 'EXPIRED':
      return 'status-expired';
    default:
      return '';
  }
};

const cancelOrder = async (order) => {
  console.log('OrderList: Cancelling order:', order);
  try {
    const apiUrl = `http://localhost:8080/api/cancel-order`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol: order.symbol,
        orderId: order.orderId,
        origClientOrderId: order.clientOrderId,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('OrderList: Order cancelled:', data);
    fetchOpenOrders();
    fetchOrderHistory();
  } catch (err) {
    error.value = err.message;
    console.error('OrderList: Error cancelling order:', err);
  }
};

const tableData = computed(() => {
  if (activeTab.value === 'openOrders') {
    return openOrders.value;
  } else if (activeTab.value === 'orderHistory') {
    return orderHistory.value;
  } else if (activeTab.value === 'tradeHistory') {
    return tradeHistory.value;
  }
  return [];
});

watch(() => webSocketStore.currentPair, () => {
  console.log('Order filter changed to:', webSocketStore.currentPair);
  fetchOpenOrders();
  fetchOrderHistory();
  fetchTradeHistory();
});

onMounted(() => {
  fetchOpenOrders();
  fetchOrderHistory();
  fetchTradeHistory();
  fetchPositions();
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
.status-rejected {
  color: red;
}
.status-expired {
  color: red;
}
</style>
