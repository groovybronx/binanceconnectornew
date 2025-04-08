// routes/cancelOrderRoute.js
const express = require('express');

/**
 * @function createCancelOrderRoute
 * @description Creates and returns the router for cancelling an order.
 * @param {Spot} client - The Binance Spot API client instance.
 * @returns {express.Router} The router for cancelling an order.
 */
function createCancelOrderRoute(client) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    console.log(`Backend: Received HTTP request on /api/cancel-order`);
    try {
      const { symbol, orderId, origClientOrderId } = req.body;

      if (!symbol || (!orderId && !origClientOrderId)) {
        return res.status(400).json({ error: 'Symbol and either orderId or origClientOrderId are required.' });
      }

      const params = {
        symbol: symbol,
      };

      if (orderId) {
        params.orderId = orderId;
      } else {
        params.origClientOrderId = origClientOrderId;
      }

      const cancelOrderResponse = await client.cancelOrder(symbol, params);

      console.log('Backend: Cancel order response:', cancelOrderResponse.data);
      res.status(200).json(cancelOrderResponse.data);
    } catch (error) {
      console.error('Backend: Error cancelling order:', error);
      const statusCode = error.response?.status || 500;
      const errorResponse = { error: error.response?.data || error.message || 'Error cancelling order.' };
      return res.status(statusCode).json(errorResponse);
    }
  });

  return router;
}

module.exports = createCancelOrderRoute;
