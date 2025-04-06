// routes/balanceRoutes.js
/**
 * @module routes/balanceRoutes
 * @description Module for handling balance related routes.
 */
const express = require('express');

/**
 * @function createBalanceRoutes
 * @description Creates and returns the router for balance related routes.
 * @param {Spot} client - The Binance Spot API client instance.
 * @returns {express.Router} The router for balance related routes.
 */
function createBalanceRoutes(client) {
  const router = express.Router();

  /**
   * @route GET /api/balance/:pair
   * @description Gets the balance for a given trading pair.
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * @returns {express.Response} The response object.
   */
  router.get('/:pair', async (req, res) => {
    const requestedPair = req.params.pair.toUpperCase().trim();
    console.log(`Backend: Requête HTTP reçue sur /api/balance/${requestedPair}`);
    try {
      const baseAsset = requestedPair.replace('USDT', '');
      const quoteAsset = 'USDT';
      const accountData = await client.account();
      const balances = accountData.data.balances;

      const baseBalance = balances.find(b => b.asset === baseAsset);
      const quoteBalance = balances.find(b => b.asset === quoteAsset);

      if (baseBalance && quoteBalance) {
        res.json({
          base: { asset: baseBalance.asset, free: baseBalance.free, locked: baseBalance.locked },
          quote: { asset: quoteBalance.asset, free: quoteBalance.free, locked: quoteBalance.locked }
        });
      } else if (baseBalance) {
        res.json({
          base: { asset: baseBalance.asset, free: baseBalance.free, locked: baseBalance.locked },
          quote: { asset: quoteAsset, free: 0, locked: 0 }
        });
      } else if (quoteBalance) {
        res.json({
          base: { asset: baseAsset, free: 0, locked: 0 },
          quote: { asset: quoteBalance.asset, free: quoteBalance.free, locked: quoteBalance.locked }
        });
      }
      else {
        res.status(404).json({ error: `Balances non trouvées pour ${baseAsset} et ${quoteAsset}` });
      }
    } catch (error) {
      console.error("Backend: Erreur lors de la récupération de la balance:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de la balance." });
    }
  });

  return router;
}

module.exports = createBalanceRoutes;
