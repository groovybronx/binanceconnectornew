<template>
  <div class="depth-display">
    <h3>Order Book Depth</h3>
    <div v-if="connectionStatus !== 'Connected'" class="status">
      {{ connectionStatus }}...
    </div>
    <div v-else-if="bestBidPrice && bestAskPrice" class="depth-data">
      <div class="bid-data">
        <h4>Best Bid</h4>
        <p class="data-row">
          <span class="label">Price:</span>
          <span class="value">{{ formattedBestBidPrice }}</span>
        </p>
        <p class="data-row">
          <span class="label">Quantity:</span>
          <span class="value">{{ formattedBestBidQuantity }}</span>
        </p>
      </div>
      <div class="ask-data">
        <h4>Best Ask</h4>
        <p class="data-row">
          <span class="label">Price:</span>
          <span class="value">{{ formattedBestAskPrice }}</span>
        </p>
        <p class="data-row">
          <span class="label">Quantity:</span>
          <span class="value">{{ formattedBestAskQuantity }}</span>
        </p>
      </div>
    </div>
    <div v-else class="status">No data available.</div>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const bestBidPrice = ref(null);
const bestBidQuantity = ref(null);
const bestAskPrice = ref(null);
const bestAskQuantity = ref(null);
const connectionStatus = ref('Connecting');
const ws = ref(null);

const formattedBestBidPrice = computed(() => {
  return bestBidPrice.value !== null ? parseFloat(bestBidPrice.value).toFixed(8).replace(/\.?0+$/, '') : null;
});

const formattedBestBidQuantity = computed(() => {
  return bestBidQuantity.value !== null ? parseFloat(bestBidQuantity.value).toFixed(8).replace(/\.?0+$/, '') : null;
});

const formattedBestAskPrice = computed(() => {
  return bestAskPrice.value !== null ? parseFloat(bestAskPrice.value).toFixed(8).replace(/\.?0+$/, '') : null;
});

const formattedBestAskQuantity = computed(() => {
  return bestAskQuantity.value !== null ? parseFloat(bestAskQuantity.value).toFixed(8).replace(/\.?0+$/, '') : null;
});

const connectWebSocket = () => {
  const backendWsUrl = 'ws://localhost:8080';
  console.log(`DepthDisplay: Attempting to connect to WebSocket backend at ${backendWsUrl}`);
  ws.value = new WebSocket(backendWsUrl);

  ws.value.onopen = () => {
    console.log('DepthDisplay: WebSocket connection to backend established.');
    connectionStatus.value = 'Connected';
  };

  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'depthUpdate') {
        // Extract only the best bid and best ask
        if (data.bids && data.bids.length > 0) {
          bestBidPrice.value = data.bids[0][0];
          bestBidQuantity.value = data.bids[0][1];
        }
        if (data.asks && data.asks.length > 0) {
          bestAskPrice.value = data.asks[0][0];
          bestAskQuantity.value = data.asks[0][1];
        }
        console.log('DepthDisplay: Best Bid:', bestBidPrice.value, bestBidQuantity.value);
        console.log('DepthDisplay: Best Ask:', bestAskPrice.value, bestAskQuantity.value);
      }
    } catch (error) {
      console.error('DepthDisplay: Failed to parse message or update state:', error);
    }
  };

  ws.value.onerror = (error) => {
    console.error('DepthDisplay: WebSocket Error:', error);
    connectionStatus.value = 'Error';
  };

  ws.value.onclose = (event) => {
    console.log(
      'DepthDisplay: WebSocket connection closed:',
      event.reason || `Code ${event.code}`
    );
    connectionStatus.value = `Closed (${event.code})`;
  };
};

onMounted(() => {
  connectWebSocket();
});

onUnmounted(() => {
  if (ws.value) {
    console.log('DepthDisplay: Closing WebSocket connection from frontend.');
    ws.value.close();
  }
});
</script>

<style scoped>
.depth-display {
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 8px;
  min-width: 300px;
  background-color: #181414;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.status {
  text-align: center;
  color: #878484;
}

.depth-data {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.bid-data,
.ask-data {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin: 5px;
  width: 150px; /* Fixed width */
  height: 100px; /* Fixed height */
  display: flex;
  color:#181414;
  flex-direction: column;
  justify-content: center;
}

.bid-data {
  background-color: #e0ffe0; /* Light green */
}

.ask-data {
  background-color: #ffe0e0; /* Light red */
}

.data-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.label {
  font-weight: bold;
  margin-right: 5px;
  width: 60px;
  text-align: left;
}

.value {
  flex-grow: 1;
  text-align: right;
}

.price {
  font-size: 1em;
}

.quantity {
  font-size: 1em;
}
</style>

