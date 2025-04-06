// binance.js
/**
 * @module binance
 * @description Module for interacting with the Binance API.
 */
const { Spot } = require('@binance/connector');
const { subscribeToDepth } = require('./websocket');

/**
 * @type {TickerService|null}
 * @description The ticker service instance.
 */
let tickerService = null;

/**
 * @type {string|null}
 * @description The current trading pair.
 */
let currentTradingPair = null;

/**
 * @function setupBinanceClient
 * @description Sets up the Binance Spot API client.
 * @param {string} apiKey - The Binance API key.
 * @param {string} apiSecret - The Binance API secret.
 * @param {string} baseUrl - The base URL for the Binance API.
 * @returns {Spot} The Binance Spot API client instance.
 */
function setupBinanceClient(apiKey, apiSecret, baseUrl) {
  return new Spot(apiKey, apiSecret, { baseURL: baseUrl });
}

/**
 * @function subscribeToPair
 * @description Subscribes to a trading pair and sets up the ticker service and depth stream.
 * @param {string} pairSymbol - The trading pair symbol (e.g., 'BTCUSDT').
 * @param {function} broadcast - The function to broadcast data to connected clients.
 * @param {TickerService} TickerService - The TickerService class.
 */
function subscribeToPair(pairSymbol, broadcast, TickerService) {
  const newPairUpper = pairSymbol.toUpperCase();
  if (tickerService) {
    tickerService.disconnect() ;
  }
  currentTradingPair = newPairUpper;
  tickerService = new TickerService(currentTradingPair, broadcast);
  broadcast({ type: 'config', pair: currentTradingPair });
  subscribeToDepth(currentTradingPair, broadcast);
}

/**
 * @function getCurrentTradingPair
 * @description Gets the current trading pair.
 * @returns {string|null} The current trading pair.
 */
function getCurrentTradingPair() {
  return currentTradingPair;
}

/**
 * @function disconnectTickerService
 * @description Disconnects the ticker service.
 */
function disconnectTickerService() {
  if (tickerService) {
    tickerService.disconnect();
  }
}

module.exports = { setupBinanceClient, subscribeToPair, getCurrentTradingPair, disconnectTickerService };
