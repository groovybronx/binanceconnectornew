<template>
  <div class="account-info component-container rounded shadow gradient-background">
    <h3>Account Information</h3>
    <div v-if="connectionStatus !== 'Connected'" class="status">{{ connectionStatus }}...</div>
    <div v-else-if="accountData" class="account-data">
      <h4>Balances</h4>
      <ul class="balances-list">
        <li v-for="balance in accountData.balances" :key="balance.asset" class="balance-item">
          <span class="asset">{{ balance.asset }}:</span>
          <span class="free">Free: {{ formatBalance(balance.free) }}</span>
          <span class="locked">Locked: {{ formatBalance(balance.locked) }}</span>
        </li>
      </ul>
    </div>
    <div v-else class="status">Loading account data...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const accountData = ref(null);
const connectionStatus = ref('Connecting');
const ws = ref(null);

const formatBalance = (balance) => {
  return parseFloat(balance).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
};

const connectWebSocket = () => {
  const backendWsUrl = 'ws://localhost:8080';
  console.log(`AccountInfo: Attempting to connect to WebSocket backend at ${backendWsUrl}`);
  ws.value = new WebSocket(backendWsUrl);

  ws.value.onopen = () => {
    console.log('AccountInfo: WebSocket connection opened');
    connectionStatus.value = 'Connected';
    fetchAccountData();
  };

  ws.value.onmessage = (event) => {
    // We don't need to handle messages here, as we are fetching the data via REST API
  };

  ws.value.onerror = (error) => {
    console.error('AccountInfo: WebSocket error:', error);
    connectionStatus.value = 'Error';
  };

  ws.value.onclose = (event) => {
    console.log('AccountInfo: WebSocket connection closed:', event.reason || `Code ${event.code}`);
    connectionStatus.value = `Closed (${event.code})`;
  };
};

const fetchAccountData = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/account');
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    accountData.value = data;
  } catch (error) {
    console.error('AccountInfo: Error fetching account data:', error);
    connectionStatus.value = 'Error';
  }
};

onMounted(() => {
  connectWebSocket();
});

onUnmounted(() => {
  if (ws.value) {
    console.log('AccountInfo: Closing WebSocket connection from frontend.');
    ws.value.close();
  }
});
</script>

<style scoped>
.account-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.balances-list {
  list-style: none;
  padding: 0;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.asset {
  font-weight: bold;
}
</style>
