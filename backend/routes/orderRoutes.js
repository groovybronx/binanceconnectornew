// routes/orderRoutes.js
/**
 * @module routes/orderRoutes
 * @description Module for handling order related routes.
 */
const express = require('express');
const { Console } = require('console');
const crypto = require('crypto');
const { randomString, buildQueryString } = require('@binance/connector/src/helpers/utils');
const WebsocketAPI = require('@binance/connector').WebsocketAPI;
const dotenv = require('dotenv');
dotenv.config();

const logger = new Console({ stdout: process.stdout, stderr: process.stderr });

const apiKey = process.env.BINANCE_API_KEY || '';
const apiSecret = process.env.BINANCE_API_SECRET || '';
const wsURL = 'wss://ws-api.testnet.binance.vision/ws-api/v3';

// Create a single WebsocketAPI client instance outside the route handler
const client = new WebsocketAPI(apiKey, apiSecret, { wsURL });

/**
 * @function createOrderRoutes
 * @description Creates and returns the router for order related routes.
 * @param {function} getCurrentTradingPair - A function that returns the current trading pair.
 * @returns {express.Router} The router for order related routes.
 */
function createOrderRoutes(getCurrentTradingPair) {
  const router = express.Router();

  /**
   * @route POST /api/place-order
   * @description Places a test order on Binance using the WebSocket API. Handles signature generation manually.
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * @returns {express.Response} The response object.
   */
  router.post('/', async (req, res) => {
    const orderData = req.body;
    console.log(`Backend: Requête HTTP reçue sur /api/place-order pour:`, orderData);

    // Input validation
    if (!orderData.side || !orderData.type || !orderData.quantity) {
      return res.status(400).json({ error: 'Missing required order parameters.' });
    }
    if (orderData.type === 'LIMIT' && !orderData.price) {
      return res.status(400).json({ error: 'Missing price for LIMIT order.' });
    }
    const quantity = Number(orderData.quantity);
    const price = orderData.type === 'LIMIT' ? Number(orderData.price) : null;
    if (isNaN(quantity) || (orderData.type === 'LIMIT' && isNaN(price))) {
      return res.status(400).json({ error: 'Invalid quantity or price.' });
    }

    try {
      const currentPair = getCurrentTradingPair();
      const orderParams = {
        symbol: currentPair,
        side: orderData.side,
        type: orderData.type,
        quantity: quantity,
        newClientOrderId: 'my_order_id_' + Date.now(),
        newOrderRespType: 'FULL',
      };

      if (orderData.type === 'LIMIT') {
        orderParams.timeInForce = 'GTC';
        orderParams.price = price;
      }

      // Get Binance server time
      const serverTimeResponse = await client.time();
      if (!serverTimeResponse || !serverTimeResponse.serverTime) {
        throw new Error('Invalid server time response from Binance.');
      }
      const timestamp = serverTimeResponse.serverTime;

      // Construct the payload manually
      const queryString = buildQueryString({ ...orderParams, timestamp });
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');

      const payload = {
        id: randomString(),
        method: 'order.test',
        params: {
          ...orderParams,
          timestamp,
          signature,
          apiKey,
          computeCommissionRates: false,
        },
      };

      const orderResponse = await new Promise((resolve, reject) => {
        const callbacks = {
          open: (client) => {
            logger.debug('Connected with Websocket server');
            client.send(JSON.stringify(payload));
          },
          close: () => logger.debug('Disconnected with Websocket server'),
          message: (data) => {
            logger.info('Received message:', data);
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.status === 200) {
                resolve({}); // Resolve with an empty object for order.test
              } else {
                reject(parsedData);
              }
            } catch (parseError) {
              logger.error('Error parsing message:', parseError);
              reject(parseError);
            }
          },
          error: (error) => {
            logger.error('Error with Websocket server', error);
            reject(error);
          },
        };
        // Use the existing client instance
        client.callbacks = callbacks;
        client.connect();
      });

      console.log('Backend: Order response:', orderResponse);
      res.status(200).json({ message: 'Order placed successfully!', order: orderResponse });
    } catch (error) {
      console.error("Backend: Erreur lors du placement de l'ordre:", error);
      console.error("Backend: Détails de l'erreur:", JSON.stringify(error, null, 2));
      res.status(500).json({ error: error.message || "Error placing order." });
    }
  });

  return router;
}

module.exports = createOrderRoutes;
