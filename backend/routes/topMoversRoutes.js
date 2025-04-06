// routes/topMoversRoutes.js
/**
 * @module routes/topMoversRoutes
 * @description Module for handling top movers related routes.
 */
const express = require('express');

/**
 * @function createTopMoversRoutes
 * @description Creates and returns the router for top movers related routes.
 * @param {Spot} client - The Binance Spot API client instance.
 * @returns {express.Router} The router for top movers related routes.
 */
function createTopMoversRoutes(client) {
  const router = express.Router();

  /**
   * @route GET /api/top-movers
   * @description Gets the top 10 gainers and top 10 losers from Binance (USDT pairs only).
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * @returns {express.Response} The response object.
   */
  router.get('/', async (req, res) => {
    console.log(`Backend: Requête HTTP reçue sur /api/top-movers`);
    try {
      const tickers = await client.ticker24hr();
      const allTickers = tickers.data;

      // Filter out tickers that don't have a priceChangePercent and are not USDT pairs
      const validTickers = allTickers.filter(ticker => ticker.priceChangePercent && ticker.symbol.endsWith('USDT'));

      // Sort by priceChangePercent (descending for gainers)
      const sortedGainers = validTickers.sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));

      // Create a copy of validTickers before sorting for losers
      const sortedLosers = [...validTickers].sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent));

      // Get top 10
      const top10Gainers = sortedGainers.slice(0, 10).map(ticker => ({
        symbol: ticker.symbol,
        priceChangePercent: parseFloat(ticker.priceChangePercent).toFixed(2)
      }));
      const top10Losers = sortedLosers.slice(0, 10).map(ticker => ({
        symbol: ticker.symbol,
        priceChangePercent: parseFloat(ticker.priceChangePercent).toFixed(2)
      }));

      res.json({ gainers: top10Gainers, losers: top10Losers });
    } catch (error) {
      console.error("Backend: Erreur lors de la récupération des top movers:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des top movers." });
    }
  });

  return router;
}

module.exports = createTopMoversRoutes;
