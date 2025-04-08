<template>
  <div id="app" class="rounded shadow">
    <h1>Realtime Crypto Price</h1>
    <div class="grid-container">
      <SearchPair />
      <CryptoTicker />
      <BalanceDisplay />
      <OrderPlacement />
      <TopMovers />
      <DepthDisplay />
    </div>

    <div class="order-list-wrapper">
      <OrderList />
    </div>
  </div>
</template>

<script setup lang="ts">
import SearchPair from './components/SearchPair.vue';
import CryptoTicker from './components/CryptoTicker.vue';
import BalanceDisplay from './components/BalanceDisplay.vue';
import DepthDisplay from './components/DepthDisplay.vue';
import OrderPlacement from './components/OrderPlacement.vue';
import TopMovers from './components/TopMovers.vue';
import OrderList from './components/OrderList.vue'; // Import the OrderList component
import './assets/styles/main.css'; // Import the centralized CSS
import { onMounted, onUnmounted } from 'vue';
import { useWebSocketStore } from './stores/webSocket';

const webSocketStore = useWebSocketStore();

onMounted(() => {
  webSocketStore.connect();
});

onUnmounted(() => {
  webSocketStore.disconnect();
});
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 40px auto; /* Increased margin and center the app */
  gap: 20px; /* Increased gap */
  width: 80%; /* Reduced width to create margin on the sides */
  font-size: 14px; /* Reduced font size */
  background: linear-gradient(
    to bottom,
    var(--dark-background),
    var(--darker-background)
  ); /* Gradient background */
  padding: 20px; /* Reduced padding */
}

.grid-container {
  display: flex;
  flex-wrap: wrap;

  gap: 20px; /* Increased gap */


  width: 100%;

}

.order-list-wrapper {
  display: flex;
  width: 100%;

}
</style>
