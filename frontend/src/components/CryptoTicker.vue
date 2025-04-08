<template>
  <div
    class="crypto-ticker component-container rounded shadow gradient-background"
    :class="{ connected: isConnected, error: hasError }"
  >
    <h3>Realtime Ticker</h3>
    <div v-if="connectionStatus !== 'Connected'" class="status">{{ connectionStatus }}...</div>
    <div v-else-if="currentPrice" class="ticker-data">
      <div class="pair">{{ tradingPair }}</div>
      <div class="price" :class="priceClass">
        {{ formattedPrice }}
      </div>
      <div v-if="priceChangePercent !== null" class="change" :class="priceClass">
        ({{ priceChangePercent > 0 ? '+' : '' }}{{ priceChangePercent }}%)
      </div>
      <div class="timestamp">Last update: {{ formattedTimestamp }}</div>
    </div>
    <div v-else class="status">Waiting for data...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue' // Removed onMounted, onUnmounted
import { useWebSocketStore } from '../stores/webSocket' // Import the store

const store = useWebSocketStore() // Use the store

// Local state for comparison logic if needed, or manage in store
let lastPrice = null

// Use computed properties to access store state
const tradingPair = computed(() => store.currentPair)
const currentPrice = computed(() => store.currentPrice)
const priceChangePercent = computed(() => store.priceChangePercent)
const lastUpdate = computed(() => store.lastUpdate)
const connectionStatus = computed(() => store.connectionStatus)
const isConnected = computed(() => store.isConnected)
const hasError = computed(() => store.hasError)

// Function to format the price with dynamic decimal places and scientific notation
const formatPrice = (price) => {
  if (price === null) return '-'

  const absPrice = Math.abs(price)
  if (absPrice >= 1) {
    // If the price is greater than or equal to 1, use up to 4 decimal places
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    })
  } else if (absPrice >= 0.0001) {
    // If the price is between 0.0001 and 1, use up to 8 decimal places
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    })
  } else {
    // If the price is less than 0.0001, use scientific notation
    return price.toExponential(4)
  }
}

const formattedPrice = computed(() => {
  // Use store's currentPrice
  return formatPrice(currentPrice.value)
})

const priceClass = computed(() => {
  // Use store's priceChangePercent or compare current/last price
  if (priceChangePercent.value !== null) {
    // Ensure priceChangePercent is treated as a number for comparison
    return Number(priceChangePercent.value) >= 0 ? 'up' : 'down'
  } else {
    // Fallback logic using lastPrice (consider if this is still needed/reliable)
    if (currentPrice.value === null || lastPrice === null) return ''
    const priceDiff = Number(currentPrice.value) - lastPrice
    lastPrice = Number(currentPrice.value) // Update lastPrice
    return priceDiff >= 0 ? 'up' : 'down'
  }
})

const formattedTimestamp = computed(() => {
  // Use store's lastUpdate
  if (!lastUpdate.value) return '-'
  return new Date(lastUpdate.value).toLocaleTimeString()
})

// WebSocket connection logic is now handled by the store in App.vue
// Removed connectWebSocket, onMounted, onUnmounted
</script>

<style scoped>
.crypto-ticker {
  transition: border-color 0.3s ease;
}

.crypto-ticker.connected {
  border-left: 5px solid var(--green);
}

.crypto-ticker.error {
  border-left: 5px solid var(--red);
}

.ticker-data {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.pair {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 5px;
}

.price {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 5px;
  transition: color 0.3s ease;
}

.change {
  font-size: 1em;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.timestamp {
  font-size: 0.8em;
  color: var(--muted-text);
}
</style>
