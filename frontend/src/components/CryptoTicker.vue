<template>
  <div class="crypto-ticker component-container rounded shadow gradient-background" :class="{ connected: isConnected, error: hasError }">
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

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const tradingPair = ref('Loading...');
const currentPrice = ref(null);
const priceChangePercent = ref(null);
const lastUpdate = ref(null);
const connectionStatus = ref('Connecting');
const ws = ref(null);
let lastPrice = null; // Initialize lastPrice to null

const isConnected = computed(() => connectionStatus.value === 'Connected');
const hasError = computed(() => connectionStatus.value === 'Error');

// Function to format the price with dynamic decimal places and scientific notation
const formatPrice = (price) => {
  if (price === null) return '-';

  const absPrice = Math.abs(price);
  if (absPrice >= 1) {
    // If the price is greater than or equal to 1, use up to 4 decimal places
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  } else if (absPrice >= 0.0001) {
    // If the price is between 0.0001 and 1, use up to 8 decimal places
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    });
  } else {
    // If the price is less than 0.0001, use scientific notation
    return price.toExponential(4);
  }
};

const formattedPrice = computed(() => {
  return formatPrice(parseFloat(currentPrice.value));
});

const priceClass = computed(() => {
  if (priceChangePercent.value !== null) {
    return parseFloat(priceChangePercent.value) >= 0 ? 'up' : 'down';
  } else {
    if (currentPrice.value === null || lastPrice === null) return '';
    return parseFloat(currentPrice.value) >= lastPrice ? 'up' : 'down';
  }
});

const formattedTimestamp = computed(() => {
  if (!lastUpdate.value) return '-';
  return new Date(lastUpdate.value).toLocaleTimeString();
});

const connectWebSocket = () => {
  const backendWsUrl = 'ws://localhost:8080';
  console.log(`Attempting to connect to WebSocket backend at ${backendWsUrl}`);
  ws.value = new WebSocket(backendWsUrl);

  ws.value.onopen = () => {
    console.log('WebSocket connection to backend established.');
    connectionStatus.value = 'Connected';
  };

  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'config') {
        tradingPair.value = data.pair;
        console.log(`Trading pair set to: ${tradingPair.value}`);
      } else if (data.type === 'priceUpdate') {
        lastPrice = currentPrice.value; // Store the previous price before updating
        currentPrice.value = data.price;
        lastUpdate.value = data.timestamp;
        priceChangePercent.value = data.changePercent;
      }
    } catch (error) {
      console.error('Failed to parse message or update state:', error);
    }
  };

  ws.value.onerror = (error) => {
    console.error('WebSocket Error:', error);
    connectionStatus.value = 'Error';
  };

  ws.value.onclose = (event) => {
    console.log('WebSocket connection closed:', event.reason || `Code ${event.code}`);
    connectionStatus.value = `Closed (${event.code})`;
    currentPrice.value = null;
  };
};

onMounted(() => {
  connectWebSocket();
});

onUnmounted(() => {
  if (ws.value) {
    console.log('Closing WebSocket connection from frontend.');
    ws.value.close();
  }
});
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
