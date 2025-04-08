// routes/orderRoutes.js
/**
 * @module routes/orderRoutes
 * @description Module for handling order placement routes.
 */
const express = require('express');
const { Console } = require('console');
const { Spot } = require('@binance/connector');
const dotenv = require('dotenv');

dotenv.config();

const logger = new Console({ stdout: process.stdout, stderr: process.stderr });

/**
 * @function createOrderRoutes
 * @description Creates and returns the router for order placement routes.
 * @param {Spot} client - The Binance Spot API client instance.
 * @returns {express.Router} The router for order placement routes.
 */
function createOrderRoutes(client) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const orderData = req.body;
    console.log(`Backend: Received HTTP request on /api/place-order for:`, orderData);

    try {
      const response = await client.newOrder(
        orderData.symbol,
        orderData.side,
        orderData.type,
        {
          quantity: orderData.quantity,
          price: orderData.price,
          stopPrice: orderData.stopPrice,
          icebergQty: orderData.icebergQty,
          ...(['MARKET', 'LIMIT_MAKER'].includes(orderData.type) ? {} : {  }),
          newOrderRespType: orderData.newOrderRespType,
        }
      );

      console.log('Backend: Order placement response:', response);
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Backend: Error placing order:', error);
      const statusCode = error.response?.status || 500;
      const errorResponse = { error: error.response?.data || error.message || 'Error placing order.' };
      return res.status(statusCode).json(errorResponse);
    }
  });

  return router;
}

module.exports = createOrderRoutes;
