<template>
  <div id="app" class="rounded shadow">
    <h1>Realtime Crypto Price</h1>
    <div class="grid-container">
      <SearchPair />
      <CryptoTicker />
      <BalanceDisplay />
      <DepthDisplay />
      <OrderPlacement />
      <TopMovers />
    </div>
  </div>
</template>

<script setup>
import SearchPair from './components/SearchPair.vue'
import CryptoTicker from './components/CryptoTicker.vue'
import BalanceDisplay from './components/BalanceDisplay.vue'
import DepthDisplay from './components/DepthDisplay.vue'
import OrderPlacement from './components/OrderPlacement.vue'
import TopMovers from './components/TopMovers.vue'
import './assets/styles/main.css' // Import the centralized CSS
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  gap: 20px;
  width: 100%;
  background: linear-gradient(
    to bottom,
    var(--dark-background),
    var(--darker-background)
  ); /* Gradient background */
  padding: 20px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 20px;
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;
}
</style>
