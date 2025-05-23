// routes.js
/**
 * @module routes
 * @description Module for defining API routes.
 */
const express = require('express');
const { subscribeToPair, getCurrentTradingPair } = require('./binance');

/**
 * @function setupRoutes
 * @description Sets up the API routes for the application.
 * @param {express.Application} app - The Express application instance.
 * @param {Spot} client - The Binance Spot API client instance.
 * @param {TickerService} TickerService - The TickerService class.
 * @param {function} broadcast - The function to broadcast data to connected clients.
 */
function setupRoutes(app, client, TickerService, broadcast) {
  const router = express.Router();

  // Import route handlers
  const pairRoutes = require('./routes/pairRoutes')(client, TickerService, broadcast);
  const balanceRoutes = require('./routes/balanceRoutes')(client);
  const orderRoutes = require('./routes/orderRoutes')( getCurrentTradingPair);
  const topMoversRoutes = require('./routes/topMoversRoutes')(client);
  const allPairsRoutes = require('./routes/allPairsRoutes')(client); // Import the new route
  const rootRoutes = require('./routes/rootRoutes')(getCurrentTradingPair);
  const accountRoutes = require('./routes/accountRoutes')(client); // Import the new route

  // Use route handlers
  router.use('/set-pair', pairRoutes);
  router.use('/balance', balanceRoutes);
  router.use('/place-order', orderRoutes);
  router.use('/top-movers', topMoversRoutes);
  router.use('/all-pairs', allPairsRoutes); // Use the new route
  router.use('/', rootRoutes);
  router.use('/account', accountRoutes); // Use the new route

  // Mount the router to the app
  app.use('/api', router);
}

module.exports = { setupRoutes };
