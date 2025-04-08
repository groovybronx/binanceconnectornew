import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Define the structure for price and depth updates if needed
interface PriceUpdate {
  type: 'priceUpdate'
  pair: string
  price: number | null
  changePercent: number | null
  timestamp: number | null
}

interface DepthUpdate {
  type: 'depthUpdate'
  pair: string
  bids: [string, string][]
  asks: [string, string][]
}

interface ConfigUpdate {
  type: 'config'
  pair: string
}

type WebSocketMessage = PriceUpdate | DepthUpdate | ConfigUpdate

export const useWebSocketStore = defineStore('webSocket', () => {
  // State
  const connectionStatus = ref('Disconnected') // 'Connecting', 'Connected', 'Error', 'Closed', 'Disconnected'
  const currentPair = ref('BTCUSDT') // Default or fetched initial value
  const currentPrice = ref<number | null>(null)
  const priceChangePercent = ref<number | null>(null)
  const lastUpdate = ref<number | null>(null)
  const bestBidPrice = ref<string | null>(null)
  const bestBidQuantity = ref<string | null>(null)
  const bestAskPrice = ref<string | null>(null)
  const bestAskQuantity = ref<string | null>(null)
  const ws = ref<WebSocket | null>(null)

  // Getters
  const isConnected = computed(() => connectionStatus.value === 'Connected')
  const hasError = computed(() => connectionStatus.value === 'Error')

  // Actions
  function connect() {
    if (ws.value && (ws.value.readyState === WebSocket.OPEN || ws.value.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket Store: Already connected or connecting.')
      return
    }

    const backendWsUrl = 'ws://localhost:8080'
    console.log(`WebSocket Store: Attempting to connect to ${backendWsUrl}`)
    connectionStatus.value = 'Connecting'
    ws.value = new WebSocket(backendWsUrl)

    ws.value.onopen = () => {
      console.log('WebSocket Store: Connection established.')
      connectionStatus.value = 'Connected'
    }

    ws.value.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)

        switch (data.type) {
          case 'config':
            console.log(`WebSocket Store: Received config - Pair: ${data.pair}`)
            currentPair.value = data.pair
            // Reset price/depth data when pair changes
            currentPrice.value = null
            priceChangePercent.value = null
            lastUpdate.value = null
            bestBidPrice.value = null
            bestBidQuantity.value = null
            bestAskPrice.value = null
            bestAskQuantity.value = null
            break
          case 'priceUpdate':
            // Only update if the pair matches the current pair
            if (data.pair === currentPair.value) {
              currentPrice.value = data.price
              priceChangePercent.value = data.changePercent
              lastUpdate.value = data.timestamp
            }
            break
          case 'depthUpdate':
            // Only update if the pair matches the current pair
            if (data.pair === currentPair.value) {
              if (data.bids && data.bids.length > 0) {
                bestBidPrice.value = data.bids[0][0]
                bestBidQuantity.value = data.bids[0][1]
              } else {
                bestBidPrice.value = null
                bestBidQuantity.value = null
              }
              if (data.asks && data.asks.length > 0) {
                bestAskPrice.value = data.asks[0][0]
                bestAskQuantity.value = data.asks[0][1]
              } else {
                bestAskPrice.value = null
                bestAskQuantity.value = null
              }
            }
            break
          default:
            console.warn('WebSocket Store: Received unknown message type:', data)
        }
      } catch (error) {
        console.error('WebSocket Store: Failed to parse message or update state:', error)
      }
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket Store: Error:', error)
      connectionStatus.value = 'Error'
    }

    ws.value.onclose = (event) => {
      console.log('WebSocket Store: Connection closed:', event.reason || `Code ${event.code}`)
      connectionStatus.value = `Closed (${event.code})`
      // Reset state on close
      currentPrice.value = null
      priceChangePercent.value = null
      lastUpdate.value = null
      bestBidPrice.value = null
      bestBidQuantity.value = null
      bestAskPrice.value = null
      bestAskQuantity.value = null
      ws.value = null // Clear the WebSocket instance
      // Optionally attempt to reconnect after a delay
      // setTimeout(connect, 5000);
    }
  }

  function disconnect() {
    if (ws.value) {
      console.log('WebSocket Store: Closing connection.')
      ws.value.close()
      ws.value = null
      connectionStatus.value = 'Disconnected'
    }
  }

  // Call connect when the store is initialized (or call it from App.vue)
  // connect(); // Or manage connection lifecycle from App.vue

  return {
    // State
    connectionStatus,
    currentPair,
    currentPrice,
    priceChangePercent,
    lastUpdate,
    bestBidPrice,
    bestBidQuantity,
    bestAskPrice,
    bestAskQuantity,
    // Getters
    isConnected,
    hasError,
    // Actions
    connect,
    disconnect,
  }
})
