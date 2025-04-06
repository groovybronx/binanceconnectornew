// routes/rootRoutes.js
/**
 * @module routes/rootRoutes
 * @description Module for handling root route.
 */
const express = require('express');

/**
 * @function createRootRoutes
 * @description Creates and returns the router for the root route.
 * @param {function} getCurrentTradingPair - A function that returns the current trading pair.
 * @returns {express.Router} The router for the root route.
 */
function createRootRoutes(getCurrentTradingPair) {
  const router = express.Router();

  /**
   * @route GET /
   * @description Root route to check if the server is active.
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * @returns {express.Response} The response object.
   */
  router.get('/', (req, res) => {
    res.send(`Serveur Realtime Crypto Ticker est actif. Paire actuelle: ${getCurrentTradingPair()}.`);
  });

  return router;
}

module.exports = createRootRoutes;
