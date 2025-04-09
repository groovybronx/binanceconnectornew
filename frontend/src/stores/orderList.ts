import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useOrderListStore = defineStore('orderList', () => {
  const isLoading = ref(false);
  const error = ref(null);

  const fetchOpenOrders = async () => {
    // Implementation will be added later
  };

  const fetchOrderHistory = async () => {
    // Implementation will be added later
  };

  return { isLoading, error, fetchOpenOrders, fetchOrderHistory };
});
