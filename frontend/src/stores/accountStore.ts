import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface Balance {
  asset: string;
  free: string;
  locked: string;
}

export const useAccountStore = defineStore('account', () => {
  const accountData = ref<{ balances: Balance[] } | null>(null);
  const connectionStatus = ref('Disconnected'); // 'Connecting', 'Connected', 'Error', 'Closed', 'Disconnected'
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isConnected = computed(() => connectionStatus.value === 'Connected');

  const fetchAccountData = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch('http://localhost:8080/api/account');
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      accountData.value = await response.json();
      connectionStatus.value = 'Connected';
    } catch (err: any) {
      error.value = err.message;
      connectionStatus.value = 'Error';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    accountData,
    connectionStatus,
    isLoading,
    error,
    isConnected,
    fetchAccountData,
  };
});
