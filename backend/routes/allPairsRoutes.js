// routes/allPairsRoutes.js
/**
 * @module routes/allPairsRoutes
 * @description Module for handling the retrieval of all trading pairs.
 */
const express = require('express');

/**
 * @function createAllPairsRoutes
 * @description Creates and returns the router for retrieving all trading pairs.
 * @param {Spot} client - The Binance Spot API client instance.
 * @returns {express.Router} The router for retrieving all trading pairs.
 */
function createAllPairsRoutes(client) {
  const router = express.Router();

  /**
   * @route GET /api/all-pairs
   * @description Gets all trading pairs from Binance.
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * @returns {express.Response} The response object.
   */
  router.get('/', async (req, res) => {
    console.log(`Backend: Requête HTTP reçue sur /api/all-pairs`);
    try {
      const tickers = await client.ticker24hr();
      const allTickers = tickers.data;

      // No more filtering, we want all pairs
      const allPairs = allTickers.map(ticker => ticker.symbol);

      res.json({ allPairs: allPairs });
    } catch (error) {
      console.error("Backend: Erreur lors de la récupération de toutes les paires:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de toutes les paires." });
    }
  });

  return router;
}

module.exports = createAllPairsRoutes;
