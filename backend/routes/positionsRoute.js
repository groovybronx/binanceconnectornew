// routes/positionsRoute.js
const express = require('express');

/**
 * @function createPositionsRoute
 * @description Creates and returns the router for fetching current positions.
 * @param {Spot} client - The Binance Spot API client instance.
 * @returns {express.Router} The router for fetching current positions.
 */
function createPositionsRoute(client) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    console.log(`Backend: Received HTTP request on /api/positions`);
    try {
      // Fetch account information to get positions
      const accountInfo = await client.account();
      const positions = accountInfo.data.balances.filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0);

      console.log('Backend: Current positions:', positions);
      res.status(200).json(positions);
    } catch (error) {
      console.error('Backend: Error fetching current positions:', error);
      const statusCode = error.response?.status || 500;
      const errorResponse = { error: error.response?.data || error.message || 'Error fetching current positions.' };
      return res.status(statusCode).json(errorResponse);
    }
  });

  return router;
}

module.exports = createPositionsRoute;
