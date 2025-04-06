// routes/accountRoutes.js
/**
 * @module routes/accountRoutes
 * @description Module for handling account related routes.
 */
const express = require('express');

/**
 * @function createAccountRoutes
 * @description Creates and returns the router for account related routes.
 * @param {Spot} client - The Binance Spot API client instance.
 * @returns {express.Router} The router for account related routes.
 */
function createAccountRoutes(client) {
  const router = express.Router();

  /**
   * @route GET /api/account
   * @description Gets the account information from Binance.
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * @returns {express.Response} The response object.
   */
  router.get('/', async (req, res) => {
    console.log(`Backend: Requête HTTP reçue sur /api/account`);
    try {
      const accountData = await client.account();
      res.json(accountData.data);
    } catch (error) {
      console.error("Backend: Erreur lors de la récupération des informations du compte:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des informations du compte." });
    }
  });

  return router;
}

module.exports = createAccountRoutes;
