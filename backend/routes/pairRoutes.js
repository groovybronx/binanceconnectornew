// routes/pairRoutes.js
/**
 * @module routes/pairRoutes
 * @description Module for handling trading pair related routes.
 */
const express = require('express');
const { subscribeToPair, getCurrentTradingPair } = require('../binance');

/**
 * @function createPairRoutes
 * @description Creates and returns the router for trading pair related routes.
 * @param {Spot} client - The Binance Spot API client instance.
 * @param {TickerService} TickerService - The TickerService class.
 * @param {function} broadcast - The function to broadcast data to connected clients.
 * @returns {express.Router} The router for trading pair related routes.
 */
function createPairRoutes(client, TickerService, broadcast) {
  const router = express.Router();

  /**
   * @route POST /api/set-pair
   * @description Sets the trading pair.
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * @returns {express.Response} The response object.
   */
  router.post('/', (req, res) => {
    const requestedPair = req.body?.pair?.toUpperCase().trim();
    console.log(`Backend: Requête HTTP reçue sur /api/set-pair pour: ${requestedPair}`);

    if (!requestedPair) {
      return res.status(400).json({ error: 'Le champ "pair" est manquant dans la requête.' });
    }

    if (!/^[A-Z]{3,}[A-Z]{3,}$/.test(requestedPair)) {
      console.warn(`Backend: Format de paire invalide demandé via API: ${requestedPair}`);
      return res.status(400).json({ error: 'Format de paire invalide.' });
    }

    if (requestedPair !== getCurrentTradingPair()) {
      try {
        console.log(`Backend: Changement de paire demandé via API pour: ${requestedPair}`);
        subscribeToPair(requestedPair, broadcast, TickerService);
        return res.status(200).json({ message: 'Abonnement à la paire mis à jour.', pair: requestedPair });
      } catch (error) {
        console.error("Backend: Erreur lors du changement d'abonnement via API:", error);
        return res.status(500).json({ error: "Erreur interne lors du changement d'abonnement." });
      }
    } else {
      console.log(`Backend: Paire demandée via API déjà suivie: ${requestedPair}`);
      return res.status(200).json({ message: 'Paire déjà suivie.', pair: requestedPair });
    }
  });

  return router;
}

module.exports = createPairRoutes;
