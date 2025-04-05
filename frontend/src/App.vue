<template>
  <div id="app">
    <h1>Realtime Crypto Price</h1>
    <SearchPair />
    <CryptoTicker />
  </div>
</template>

<script setup>
import SearchPair from './components/SearchPair.vue';
import CryptoTicker from './components/CryptoTicker.vue';
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  gap: 20px;
}
h1 {
    color: #2c3e50;
    margin-bottom: 10px;
}
</style>
