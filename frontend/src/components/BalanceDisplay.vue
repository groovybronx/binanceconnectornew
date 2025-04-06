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

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const balances = ref(null)
const isLoading = ref(false)
const error = ref(null)
const pair = ref('BTCUSDT')
const connectionStatus = ref('Connecting')
const ws = ref(null)

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

const connectWebSocket = () => {
  const backendWsUrl = 'ws://localhost:8080'
  console.log(`BalanceDisplay: Attempting to connect to WebSocket backend at ${backendWsUrl}`)
  ws.value = new WebSocket(backendWsUrl)

  ws.value.onopen = () => {
    console.log('BalanceDisplay: WebSocket connection to backend established.')
    connectionStatus.value = 'Connected'
  }

  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'config') {
        pair.value = data.pair
        console.log(`BalanceDisplay: Trading pair set to: ${pair.value}`)
      }
    } catch (error) {
      console.error('BalanceDisplay: Failed to parse message or update state:', error)
    }
  }

  ws.value.onerror = (error) => {
    console.error('BalanceDisplay: WebSocket Error:', error)
    connectionStatus.value = 'Error'
  }

  ws.value.onclose = (event) => {
    console.log(
      'BalanceDisplay: WebSocket connection closed:',
      event.reason || `Code ${event.code}`,
    )
    connectionStatus.value = `Closed (${event.code})`
  }
}

watch(
  pair,
  (newPair) => {
    if (newPair) {
      fetchBalance(newPair)
    }
  },
  { immediate: true },
)

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (ws.value) {
    console.log('BalanceDisplay: Closing WebSocket connection from frontend.')
    ws.value.close()
  }
})
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
