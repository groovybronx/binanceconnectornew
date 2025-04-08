<template>
  <div class="account-info component-container rounded shadow gradient-background">
    <h3>Account Information</h3>
    <div v-if="!accountStore.isConnected && !accountStore.isLoading" class="status">Disconnected...</div>
    <div v-if="accountStore.isLoading" class="status">Loading account data...</div>
    <div v-else-if="accountStore.error" class="status error">Error: {{ accountStore.error }}</div>
    <div v-else-if="accountStore.accountData" class="account-data">
      <h4>Balances</h4>
      <ul class="balances-list">
        <li v-for="balance in accountStore.accountData.balances" :key="balance.asset" class="balance-item">
          <span class="asset">{{ balance.asset }}:</span>
          <span class="free">Free: {{ formatBalance(balance.free) }}</span>
          <span class="locked">Locked: {{ formatBalance(balance.locked) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAccountStore } from '../stores/accountStore'

const accountStore = useAccountStore()

const formatBalance = (balance: any) => {
  return parseFloat(balance).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })
}

const connectionStatus = computed(() => accountStore.connectionStatus);
const accountData = computed(() => accountStore.accountData);
const isLoading = computed(() => accountStore.isLoading);
const error = computed(() => accountStore.error);

onMounted(() => {
  accountStore.fetchAccountData();
});
</script>

<style scoped>
.account-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.balances-list {
  list-style: none;
  padding: 0;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.asset {
  font-weight: bold;
}
</style>
