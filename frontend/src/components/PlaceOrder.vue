<template>
  <div>
    <h2>Place Test Order</h2>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="side">Side:</label>
        <select id="side" v-model="orderParams.side">
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </div>
      <div>
        <label for="type">Type:</label>
        <select id="type" v-model="orderParams.type">
          <option value="MARKET">MARKET</option>
          <option value="LIMIT">LIMIT</option>
        </select>
      </div>
      <div>
        <label for="quantity">Quantity:</label>
        <input type="number" id="quantity" v-model="orderParams.quantity" required />
      </div>
      <div v-if="orderParams.type === 'LIMIT'">
        <label for="price">Price:</label>
        <input type="number" id="price" v-model="orderParams.price" required />
      </div>
      <button type="submit" :disabled="loading">
        <span v-if="loading">Placing Order...</span>
        <span v-else>Place Order</span>
      </button>
    </form>

    <div v-if="error" class="error">Error: {{ error }}</div>
    <div v-if="orderResponse">
      <h3>Order Response:</h3>
      <pre>{{ JSON.stringify(orderResponse, null, 2) }}</pre>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'PlaceOrder',
  data() {
    return {
      orderParams: {
        side: 'BUY', // Default to BUY
        type: 'MARKET', // Default to MARKET
        quantity: '',
        price: '', // Only needed for LIMIT orders
      },
      orderResponse: null,
      error: null,
      loading: false,
    }
  },
  methods: {
    async handleSubmit() {
      this.loading = true
      this.error = null
      this.orderResponse = null

      try {
        const response = await axios.post('/api/place-order', this.orderParams)
        this.orderResponse = response.data
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to place order'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.error {
  color: red;
}
</style>
