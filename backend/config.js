// config.js
/**
 * @module config
 * @description Configuration module for the application.
 * This module loads environment variables and provides configuration settings.
 */
require('dotenv').config();

/**
 * @typedef {Object} Config
 * @property {number} PORT - The port number the server will listen on.
 * @property {string} BINANCE_API_KEY - The API key for the Binance API.
 * @property {string} BINANCE_API_SECRET - The API secret for the Binance API.
 * @property {string} BINANCE_TRADING_PAIR - The default trading pair (e.g., 'BTCUSDT').
 * @property {string} BINANCE_BASE_URL - The base URL for the Binance API (e.g., 'https://testnet.binance.vision').
 */

/**
 * @type {Config}
 * @description Configuration settings for the application.
 */
module.exports = {
  /**
   * @description The port number the server will listen on. Defaults to 8080 if not set in environment variables.
   * @type {number}
   */
  PORT: parseInt(process.env.PORT || '8080', 10), // Convert to number
  /**
   * @description The API key for the Binance API. Must be set in environment variables.
   * @type {string}
   */
  BINANCE_API_KEY: process.env.BINANCE_API_KEY,
  /**
   * @description The API secret for the Binance API. Must be set in environment variables.
   * @type {string}
   */
  BINANCE_API_SECRET: process.env.BINANCE_API_SECRET,
  /**
   * @description The default trading pair. Defaults to 'BTCUSDT' if not set in environment variables.
   * @type {string}
   */
  BINANCE_TRADING_PAIR: (process.env.BINANCE_TRADING_PAIR || 'BTCUSDT').toUpperCase(),
  /**
   * @description The base URL for the Binance API. Defaults to 'https://testnet.binance.vision'.
   * @type {string}
   */
  BINANCE_BASE_URL: 'https://testnet.binance.vision',
};
