// orderTestRoute.js
const express = require('express');
const { validateRequiredParameters } = require('@binance/connector/src/helpers/validation');

/**
 * @function createOrderTestRoute
 * @description Creates and returns the router for testing order placement routes.
 * @param {Spot} client - The Binance Spot API client instance.
 * @returns {express.Router} The router for testing order placement routes.
 */
function createOrderTestRoute(client) {
  const router = express.Router();

  /**
   * @route POST /api/test-order
   * @description Tests a new order on Binance without actually placing it.
   * @param {express.Request} req - The request object.
   * @param {express.Response} res - The response object.
   * @returns {express.Response} The response object.
   * @throws {Error} Throws an error if there are missing or invalid parameters.
   */
  router.post('/', async (req, res) => {
    const orderData = req.body;
    console.log(`Backend: Received HTTP request on /api/test-order for:`, orderData);

    try {
      // --- Parameter Validation ---
      const requiredParams = ['symbol', 'side', 'type', 'quantity'];
      const missingParams = validateRequiredParameters(orderData, requiredParams);

      if (Array.isArray(missingParams) && missingParams.length > 0) {
        return res.status(400).json({ error: `Missing required parameters: ${missingParams.join(', ')}` });
      }

      // Validate enums
      const validSides = ['BUY', 'SELL'];
      const validTypes = ['LIMIT', 'MARKET', 'STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT', 'LIMIT_MAKER'];
      const validTimeInForce = ['GTC', 'IOC', 'FOK'];

      if (!validSides.includes(orderData.side)) {
        return res.status(400).json({ error: `Invalid side. Must be one of: ${validSides.join(', ')}` });
      }
      if (!validTypes.includes(orderData.type)) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
      }

      // Validate price if it's a LIMIT, STOP_LOSS_LIMIT or TAKE_PROFIT_LIMIT order
      if (['LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'].includes(orderData.type)) {
        const missingPriceParam = validateRequiredParameters(orderData, ['price']);
        if (Array.isArray(missingPriceParam) && missingPriceParam.length > 0) {
          return res.status(400).json({ error: `Missing required parameter for ${orderData.type} order: price` });
        }
      }

      if (orderData.timeInForce && !validTimeInForce.includes(orderData.timeInForce)) {
        return res.status(400).json({ error: `Invalid timeInForce. Must be one of: ${validTimeInForce.join(', ')}` });
      }

      // Validate quantity and price format
      const quantity = Number(orderData.quantity);
      const price = ['LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'].includes(orderData.type) ? Number(orderData.price) : null;

      if (isNaN(quantity) || (['LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'].includes(orderData.type) && isNaN(price))) {
        return res.status(400).json({ error: 'Invalid quantity or price. Must be a number.' });
      }

      // Get symbol from request body
      const symbol = orderData.symbol.toUpperCase();

      // Create orderParams directly, using orderData
      const orderParams = {
        symbol: symbol,
        side: orderData.side,
        type: orderData.type,
        quantity: quantity,
      };

      // Add optional parameters if they exist
      if (orderData.newClientOrderId) {
        orderParams.newClientOrderId = orderData.newClientOrderId;
      }
      if (orderData.newOrderRespType) {
        orderParams.newOrderRespType = orderData.newOrderRespType;
      }
      if (orderData.recvWindow) {
        orderParams.recvWindow = orderData.recvWindow;
      }

      if (['LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'].includes(orderData.type)) {
        orderParams.timeInForce = orderData.timeInForce || 'GTC';
        orderParams.price = price;
      }

      // Test the order using the Binance connector
      const testOrderResponse = await client.newOrderTest(
        orderParams.symbol,
        orderParams.side,
        orderParams.type,
        orderParams
      );
      console.log('Backend: Test order response:', testOrderResponse.data);
      res.status(200).json(testOrderResponse.data); // Send the response from binance to the frontend
    } catch (error) {
      console.error('Backend: Error testing order:', error);
      console.error('Backend: Error details:', JSON.stringify(error, null, 2));

      let errorResponse = { error: 'Error testing order.' };
      let statusCode = 500;

      if (error.response && error.response.data) {
        // Handle Binance API errors
        errorResponse = { error: error.response.data };
        statusCode = error.response.status || 500;
      } else if (error.message === 'Invalid quantity or price. Must be a number.') {
        errorResponse = { error: error.message };
        statusCode = 400;
      } else if (error.message.startsWith('Missing required parameters:')) {
        errorResponse = { error: error.message };
        statusCode = 400;
      } else {
        // Handle other errors
        errorResponse = { error: error.message };
        statusCode = 400;
      }

      return res.status(statusCode).json(errorResponse);
    }
  });

  return router;
}

module.exports = createOrderTestRoute;
