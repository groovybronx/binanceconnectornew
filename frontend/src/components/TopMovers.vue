<template>
  <div class="top-movers component-container rounded shadow gradient-background">
    <h3>Top Movers</h3>
    <button @click="fetchTopMovers">Refresh</button>
    <div v-if="isLoading" class="status">Loading...</div>
    <div v-else-if="error" class="status error">{{ error }}</div>
    <div v-else class="movers-data">
      <div class="gainers">
        <h4>Top 10 Gainers</h4>
        <ul>
          <li v-for="gainer in topGainers" :key="gainer.symbol" class="data-row">
            <span class="label">{{ formatSymbol(gainer.symbol) }}</span>
            <span class="value up">{{ gainer.priceChangePercent }}%</span>
          </li>
        </ul>
      </div>
      <div class="losers">
        <h4>Top 10 Losers</h4>
        <ul>
          <li v-for="loser in topLosers" :key="loser.symbol" class="data-row">
            <span class="label">{{ formatSymbol(loser.symbol) }}</span>
            <span class="value down">{{ loser.priceChangePercent }}%</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const topGainers = ref([]);
const topLosers = ref([]);
const isLoading = ref(false);
const error = ref(null);

const fetchTopMovers = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch('http://localhost:8080/api/top-movers');
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    topGainers.value = data.gainers;
    topLosers.value = data.losers;
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const formatSymbol = (symbol) => {
  return symbol.replace('USDT', '');
};

onMounted(() => {
  fetchTopMovers();
});
</script>

<style scoped>
.top-movers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.movers-data {
  display: flex;
  gap: 20px;
}

.gainers,
.losers {
  flex: 1;
}

.gainers ul,
.losers ul {
  list-style: none;
  padding: 0;
}

.data-row {
  font-size: small;
  display: flex;
  justify-content: space-between;
  width: 100%;
  overflow: hidden; /* Hide overflowing content */
  text-overflow: ellipsis; /* Add ellipsis for overflowing text */
  white-space: nowrap; /* Prevent text from wrapping */
}
.label {
  overflow: hidden; /* Hide overflowing content */
  text-overflow: ellipsis; /* Add ellipsis for overflowing text */
  white-space: nowrap; /* Prevent text from wrapping */
}
</style>
