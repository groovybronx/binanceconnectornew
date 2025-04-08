// routes/ordersRoute.js
const express = require('express');

/**
 * @function createOrdersRoute
 * @description Creates and returns the router for fetching all orders and open orders.
 * @param {Spot} client - The Binance Spot API client instance.
 * @returns {express.Router} The router for fetching all orders and open orders.
 */
function createOrdersRoute(client) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    console.log(`Backend: Received HTTP request on /api/orders`);
    try {
      const symbol = req.query.symbol || 'XRPUSDT';
      const [allOrdersResponse, openOrdersResponse] = await Promise.all([
        client.allOrders(symbol),
        client.openOrders({ symbol: symbol }),
      ]);

      const allOrders = allOrdersResponse.data.map(order => ({ ...order, status: order.status }));
      const openOrders = openOrdersResponse.data.map(order => ({ ...order, status: order.status }));

      const combinedOrders = [...allOrders, ...openOrders];

      const uniqueOrders = combinedOrders.filter((order, index, self) =>
        index === self.findIndex((o) => o.orderId === order.orderId)
      );

      uniqueOrders.sort((a, b) => b.time - a.time);

      console.log('Backend: All orders response:', uniqueOrders);
      res.status(200).json(uniqueOrders);
    } catch (error) {
      console.error('Backend: Error fetching all orders:', error);
      const statusCode = error.response?.status || 500;
      const errorResponse = { error: error.response?.data || error.message || 'Error fetching all orders.' };
      return res.status(statusCode).json(errorResponse);
    }
  });

  return router;
}

module.exports = createOrdersRoute;
