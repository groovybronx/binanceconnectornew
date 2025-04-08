<template>
  <div class="balance-display component-container rounded shadow gradient-background">
    <h3>Balance</h3>
    <div v-if="connectionStatus !== 'Connected'" class="status">{{ connectionStatus }}...</div>
    <div v-else-if="isLoading" class="status">Loading...</div>
    <div v-else-if="error" class="status error">{{ error }}</div>
    <div v-else-if="balances" class="balance-data">
      <div class="balance-item rounded">
        <h4>{{ balances.base.asset }}</h4>
        <p>Free: {{ balances.base.free }}</p>
        <p>Locked: {{ balances.base.locked }}</p>
      </div>
      <div class="balance-item rounded">
        <h4>{{ balances.quote.asset }}</h4>
        <p>Free: {{ balances.quote.free }}</p>
        <p>Locked: {{ balances.quote.locked }}</p>
      </div>
    </div>
    <div v-else class="status">No data available.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue' // Removed onMounted, onUnmounted
import { useWebSocketStore } from '../stores/webSocket' // Import the store

const store = useWebSocketStore() // Use the store

const balances = ref(null)
const isLoading = ref(false)
const error = ref(null)

// Use computed properties for pair and connection status from the store
const pair = computed(() => store.currentPair)
const connectionStatus = computed(() => store.connectionStatus)

const fetchBalance = async (pair) => {
  isLoading.value = true
  error.value = null
  balances.value = null
  try {
    const response = await fetch(`http://localhost:8080/api/balance/${pair}`)
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || `HTTP error! status: ${response.status}`)
    }
    balances.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// Watch the pair from the store to fetch balance
watch(
  pair,
  (newPair) => {
    if (newPair && store.isConnected) { // Fetch only if connected and pair is available
      fetchBalance(newPair)
    } else if (!store.isConnected) {
      // Optionally clear balance or show a message if disconnected
      balances.value = null;
      error.value = 'WebSocket disconnected. Cannot fetch balance.';
    }
  },
  { immediate: true }, // Fetch balance immediately when the component mounts if connected
)

// Removed connectWebSocket, onMounted, onUnmounted as WS is handled by the store/App.vue
</script>

<style scoped>
.balance-display {
}

.balance-data {
  display: flex;
  justify-content: space-around;
  text-align: left;
}

.balance-item {
  flex: 1;
  padding: 15px;
  margin: 5px;
  background-color: var(--dark-background);
}

.balance-item h4 {
  margin-bottom: 10px;
}
</style>
