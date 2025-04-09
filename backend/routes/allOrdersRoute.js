// allOrdersRoute.js
const express = require('express');

/**
 * @function createAllOrdersRoute
 * @description Creates and returns the router for fetching all orders.
 * @param {Spot} client - The Binance Spot API client instance.
 * @returns {express.Router} The router for fetching all orders.
 */
function createAllOrdersRoute(client) {
  const router = express.Router();

  /**
   * @route GET /api/all-orders
   * @description Fetches all orders from Binance.
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * @returns {express.Response} The response object.
   * @throws {Error} Throws an error if there is a problem fetching the orders.
   */
  router.get('/', async (req, res) => {
    console.log(`Backend: Received HTTP request on /api/all-orders`);
    try {
      const symbol = req.query.symbol;
      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required.' });
      }
      const allOrdersResponse = await client.allOrders(symbol);
      console.log('Backend: All orders response:', allOrdersResponse.data);
      res.status(200).json(allOrdersResponse.data);
    } catch (error) {
      console.error('Backend: Error fetching all orders:', error);
      console.error('Backend: Error details:', JSON.stringify(error, null, 2));

      let errorResponse = { error: 'Error fetching all orders.' };
      let statusCode = 500;

      if (error.response && error.response.data) {
        // Handle Binance API errors
        errorResponse = { error: error.response.data };
        statusCode = error.response.status || 500;
      } else {
        // Handle other errors
        errorResponse = { error: error.message };
        statusCode = 400;
      }

      return res.status(statusCode).json(errorResponse);
    }
  });

  return router;
}

module.exports = createAllOrdersRoute;
