<template>
  <div class="depth-display component-container rounded shadow gradient-background">
    <h3>Order Book Depth</h3>
    <div v-if="connectionStatus !== 'Connected'" class="status">{{ connectionStatus }}...</div>
    <div v-else-if="bids.length > 0 && asks.length > 0" class="depth-data">
      <div class="bid-data rounded" :class="{'sell-trend': buyingSellingForce < 1}">
        <h4>Spread:</h4>
        <p class="data-row">
          <span class="value price">{{ spread }}</span>
        </p>
        <h4>Buying/Selling Force:</h4>
        <p class="data-row">
          <span class="value" :class="{'strong-buy': buyingSellingForce > 1, 'strong-sell': buyingSellingForce < 1, 'neutral': buyingSellingForce === 1}">
            {{ buyingSellingForceText }}
          </span>
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

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, shallowRef } from 'vue'

const bids = ref<[string, string][]>([])
const asks = ref<[string, string][]>([])
const connectionStatus = ref('Connecting')
const ws = ref(null)
const isUpdating = ref(true)

const depthHistory = ref<any[]>([]) // Store depth history
const historyDuration = 10000 // 10 seconds

const topBids = computed(() => {
  const slicedBids = bids.value.slice(0, 5);
  while (slicedBids.length < 5) {
    slicedBids.push(['-', '-']); // Add empty values
  }
  console.log('Frontend: topBids:', slicedBids);
  return slicedBids;
})
const topAsks = computed(() => {
  const slicedAsks = asks.value.slice(0, 5);
  while (slicedAsks.length < 5) {
    slicedAsks.push(['-', '-']); // Add empty values
  }
  console.log('Frontend: topAsks:', slicedAsks);
  return slicedAsks;
})

const totalBidVolume = computed(() => {
  const volume = bids.value.reduce((total, bid) => total + parseFloat(bid[1]), 0).toFixed(8);
  console.log('Frontend: totalBidVolume:', volume);
  return volume;
})

const totalAskVolume = computed(() => {
  const volume = asks.value.reduce((total, ask) => total + parseFloat(ask[1]), 0).toFixed(8);
  console.log('Frontend: totalAskVolume:', volume);
  return volume;
})

const formatPrice = (price: string) => {
  return parseFloat(price).toFixed(8).replace(/\.?0+$/, '')
}

const formatQuantity = (quantity: string) => {
  return parseFloat(quantity).toFixed(8).replace(/\.?0+$/, '')
}

const connectWebSocket = () => {
  const backendWsUrl = 'ws://localhost:8080'
  console.log(`DepthDisplay: Attempting to connect to WebSocket backend at ${backendWsUrl}`)
  ws.value = new WebSocket(backendWsUrl)

  ws.value.onopen = () => {
    console.log('DepthDisplay: WebSocket connection to backend established.')
    connectionStatus.value = 'Connected'
  }

  ws.value.onmessage = (event) => {
    if (!isUpdating.value) return
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'depthUpdate') {
        // Aggregate bids
        const aggregatedBids = data.bids.reduce((acc, [price, quantity]) => {
          const existingBid = acc.find(bid => bid[0] === price);
          if (existingBid) {
            existingBid[1] = (parseFloat(existingBid[1]) + parseFloat(quantity)).toString();
          } else {
            acc.push([price, quantity]);
          }
          return acc;
        }, []);

        // Aggregate asks
        const aggregatedAsks = data.asks.reduce((acc, [price, quantity]) => {
          const existingAsk = acc.find(ask => ask[0] === price);
          if (existingAsk) {
            existingAsk[1] = (parseFloat(existingAsk[1]) + parseFloat(quantity)).toString();
          } else {
            acc.push([price, quantity]);
          }
          return acc;
        }, []);

        bids.value = aggregatedBids;
        asks.value = aggregatedAsks;

        // Store depth data with timestamp
        depthHistory.value.push({
          timestamp: Date.now(),
          bids: aggregatedBids,
          asks: aggregatedAsks,
        });

        // Clean up old data
        const now = Date.now();
        depthHistory.value = depthHistory.value.filter(item => now - item.timestamp <= historyDuration);
      }
    } catch (error) {
      console.error('DepthDisplay: Failed to parse message or update state:', error);
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

const spread = shallowRef('-');

const updateSpread = () => {
  if (bids.value.length > 0 && asks.value.length > 0) {
    const bestBid = parseFloat(bids.value[0][0]);
    const bestAsk = parseFloat(asks.value[0][0]);
    spread.value = (bestAsk - bestBid).toFixed(8);
  }
};

watch([bids, asks], () => {
  updateSpread();
});

const buyingSellingForce = computed(() => {
  let totalBidVolumeHistory = 0;
  let totalAskVolumeHistory = 0;

  depthHistory.value.forEach(item => {
    totalBidVolumeHistory += item.bids.reduce((total, bid) => total + parseFloat(bid[1]), 0);
    totalAskVolumeHistory += item.asks.reduce((total, ask) => total + parseFloat(ask[1]), 0);
  });

  if (totalBidVolumeHistory > 0 && totalAskVolumeHistory > 0) {
    return totalBidVolumeHistory / totalAskVolumeHistory;
  } else {
    return 1; // Neutral if no data
  }
});

const buyingSellingForceText = computed(() => {
  if (buyingSellingForce.value > 1.2) {
    return 'Strong Buy';
  } else if (buyingSellingForce.value > 1) {
    return 'Buy';
  } else if (buyingSellingForce.value < 0.8) {
    return 'Strong Sell';
  } else if (buyingSellingForce.value < 1) {
    return 'Sell';
  } else {
    return 'Neutral';
  }
});

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
  position: relative;
  overflow: auto; /* Enable scrolling if content overflows */
  border: 1px solid var(--dark-border); /* Add a border */
  font-family: 'Arial', sans-serif; /* Use a more professional font */
  text-align: center; /* Center the text */
}

.depth-data {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px; /* Smaller font size for better readability */
}

.bid-data,
.ask-data {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* Align content to the top */
  height: auto; /* Fixed height for bid and ask frames */
  overflow: auto; /* Enable scrolling if content overflows */
}

.bid-data {
  background-color: var(--dark-green-bid); /* Dark green */
}

.ask-data {
  background-color: var(--dark-red-ask); /* Dark red */
}

.sell-trend {
  background-color: rgb(96, 43, 43);
}

.data-row {
  margin-bottom: 5px; /* Add spacing between data rows */
  display: flex; /* Use flexbox for layout */
  table-layout: fixed; /* Fixed table layout */
  width: 100%; /* Take full width */
}

.label {
  font-weight: bold;
  margin-right: 5px;
  width: 50%; /* Fixed width for label column */
  text-align: left; /* Align label to the left */
}

.value {
  color: var(--light-text); /* Use a lighter text color */
  width: 50%; /* Fixed width for value column */
  text-align: right; /* Align value to the right */
}

.strong-buy::before {
  content: "▲ "; /* Upward triangle */
  color: green;
}

.strong-sell::before {
  content: "▼ "; /* Downward triangle */
  color: red;
}

.neutral {
  color: gray;
}

/* Style the spread */
.spread {
  font-size: 20px; /* Larger font size */
  color: orange; /* Different color */
  font-weight: bold;
}

/* New styles for the button */
button {
  padding: 8px 16px; /* Smaller button padding */
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;
  font-size: 12px; /* Smaller button font size */
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

/* Add this class to DepthDisplay to match grid item size */
.grid-item {
  min-width: 300px;
  flex: 1; /* Allow the item to grow to fill available space */
}
</style>
