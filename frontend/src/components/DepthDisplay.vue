<template>
  <div class="depth-display component-container rounded shadow gradient-background">
    <h3>Order Book Depth</h3>
    <div v-if="connectionStatus !== 'Connected'" class="status">{{ connectionStatus }}...</div>
    <div v-else-if="bestBidPrice && bestAskPrice" class="depth-data">
      <div class="bid-data rounded">
        <h4>Best Bid</h4>
        <p class="data-row">
          <span class="label">Price:</span>
          <span class="value price">{{ formattedBestBidPrice }}</span>
        </p>
        <p class="data-row">
          <span class="label">Quantity:</span>
          <span class="value quantity">{{ formattedBestBidQuantity }}</span>
        </p>
      </div>
      <div class="ask-data rounded">
        <h4>Best Ask</h4>
        <p class="data-row">
          <span class="label">Price:</span>
          <span class="value price">{{ formattedBestAskPrice }}</span>
        </p>
        <p class="data-row">
          <span class="label">Quantity:</span>
          <span class="value quantity">{{ formattedBestAskQuantity }}</span>
        </p>
      </div>
    </div>
    <div v-else class="status">No data available.</div>
    <div class="button-container">
      <button
        @click="toggleUpdates"
        :class="{ 'stop-button': isUpdating, 'start-button': !isUpdating }"
      >
        {{ isUpdating ? 'Stop' : 'Start' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const bestBidPrice = ref(null)
const bestBidQuantity = ref(null)
const bestAskPrice = ref(null)
const bestAskQuantity = ref(null)
const connectionStatus = ref('Connecting')
const ws = ref(null)
const isUpdating = ref(true) // New: Track if updates are active

const formattedBestBidPrice = computed(() => {
  return bestBidPrice.value !== null
    ? parseFloat(bestBidPrice.value)
        .toFixed(8)
        .replace(/\.?0+$/, '')
    : null
})

const formattedBestBidQuantity = computed(() => {
  return bestBidQuantity.value !== null
    ? parseFloat(bestBidQuantity.value)
        .toFixed(8)
        .replace(/\.?0+$/, '')
    : null
})

const formattedBestAskPrice = computed(() => {
  return bestAskPrice.value !== null
    ? parseFloat(bestAskPrice.value)
        .toFixed(8)
        .replace(/\.?0+$/, '')
    : null
})

const formattedBestAskQuantity = computed(() => {
  return bestAskQuantity.value !== null
    ? parseFloat(bestAskQuantity.value)
        .toFixed(8)
        .replace(/\.?0+$/, '')
    : null
})

const connectWebSocket = () => {
  const backendWsUrl = 'ws://localhost:8080'
  console.log(`DepthDisplay: Attempting to connect to WebSocket backend at ${backendWsUrl}`)
  ws.value = new WebSocket(backendWsUrl)

  ws.value.onopen = () => {
    console.log('DepthDisplay: WebSocket connection to backend established.')
    connectionStatus.value = 'Connected'
  }

  ws.value.onmessage = (event) => {
    if (!isUpdating.value) return // Skip updates if isUpdating is false
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'depthUpdate') {
        // Extract only the best bid and best ask
        if (data.bids && data.bids.length > 0) {
          bestBidPrice.value = data.bids[0][0]
          bestBidQuantity.value = data.bids[0][1]
        }
        if (data.asks && data.asks.length > 0) {
          bestAskPrice.value = data.asks[0][0]
          bestAskQuantity.value = data.asks[0][1]
        }
        // console.log('DepthDisplay: Best Bid:', bestBidPrice.value, bestBidQuantity.value)
        // console.log('DepthDisplay: Best Ask:', bestAskPrice.value, bestAskQuantity.value)
      }
    } catch (error) {
      console.error('DepthDisplay: Failed to parse message or update state:', error)
    }
  }

  ws.value.onerror = (error) => {
    console.error('DepthDisplay: WebSocket Error:', error)
    connectionStatus.value = 'Error'
  }

  ws.value.onclose = (event) => {
    console.log('DepthDisplay: WebSocket connection closed:', event.reason || `Code ${event.code}`)
    connectionStatus.value = `Closed (${event.code})`
  }
}

const toggleUpdates = () => {
  isUpdating.value = !isUpdating.value
  console.log(`OrderBookDepth: Updates ${isUpdating.value ? 'started' : 'stopped'}`)
}

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (ws.value) {
    console.log('DepthDisplay: Closing WebSocket connection from frontend.')
    ws.value.close()
  }
})
</script>

<style scoped>
.depth-display {
  margin-bottom: 20px;
  position: relative; /* Make this container relative */
}

.depth-data {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bid-data,
.ask-data {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.bid-data {
  background-color: var(--dark-green-bid); /* Dark green */
}

.ask-data {
  background-color: var(--dark-red-ask); /* Dark red */
}
/* New styles for the button */
button {
  padding: 10px 20px;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.start-button {
  background-color: var(--green); /* Green for Start */
}

.stop-button {
  background-color: var(--red); /* Red for Stop */
}
/* New styles for the button container */
.button-container {
  position: absolute; /* Position the container absolutely */
  bottom: 10px; /* Align to the bottom */
  right: 10px; /* Align to the right */
}
</style>
