// routes/orderRoutes.js
/**
 * @module routes/orderRoutes
 * @description Module for handling order related routes.
 */
const express = require('express');

/**
 * @function createOrderRoutes
 * @description Creates and returns the router for order related routes.
 * @param {Spot} client - The Binance Spot API client instance.
 * @param {function} getCurrentTradingPair - A function that returns the current trading pair.
 * @returns {express.Router} The router for order related routes.
 */
function createOrderRoutes(client, getCurrentTradingPair) {
  const router = express.Router();

  /**
   * @route POST /api/place-order
   * @description Places an order on Binance.
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * @returns {express.Response} The response object.
   */
  router.post('/', async (req, res) => {
    const orderData = req.body;
    console.log(`Backend: Requête HTTP reçue sur /api/place-order pour:`, orderData);

    if (!orderData.side || !orderData.type || !orderData.quantity) {
      console.error("Backend: Erreur de validation - Paramètres manquants.");
      return res.status(400).json({ error: 'Missing required order parameters.' });
    }
    if (orderData.type === 'LIMIT' && !orderData.price) {
      console.error("Backend: Erreur de validation - Prix manquant pour ordre LIMIT.");
      return res.status(400).json({ error: 'Missing required order parameters for LIMIT order.' });
    }

    try {
      const quantity = Number(orderData.quantity);
      const price = orderData.type === 'LIMIT' ? Number(orderData.price) : null;

      if (isNaN(quantity) || (orderData.type === 'LIMIT' && isNaN(price))) {
        console.error("Backend: Erreur de validation - Quantité ou prix invalide.");
        return res.status(400).json({ error: 'Invalid quantity or price.' });
      }

      const currentPair = getCurrentTradingPair();
      const params = {
        symbol: currentPair,
        side: orderData.side,
        type: orderData.type,
        quantity: quantity,
      };
      if (orderData.type === 'LIMIT') {
        params.price = price;
        params.timeInForce = 'GTC';
      }

      console.log("Backend: Paramètres de l'ordre envoyés à Binance:", params);

      // Use the parameters to place the order
      const orderResponse = await client.newOrder(
        params.symbol,
        params.side,
        params.type,
        params
      );

      console.log("Backend: Réponse de Binance:", orderResponse.data);
      console.log('Backend: Order response:', orderResponse.data);
      res.status(200).json({ message: 'Order placed successfully!', order: orderResponse.data });
    } catch (error) {
      console.error("Backend: Erreur lors du placement de l'ordre:", error);
      console.error("Backend: Détails de l'erreur:", JSON.stringify(error));
      if (error.response) {
        console.error("Backend: Réponse d'erreur de Binance:", error.response.data);
      }
      res.status(500).json({ error: error.message || "Error placing order." });
    }
  });

  return router;
}

module.exports = createOrderRoutes;
