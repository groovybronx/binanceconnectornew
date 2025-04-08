// server.js
/**
 * @module server
 * @description Main server module for the application.
 */
const express = require('express');
const http = require('http');
const cors = require('cors');
const { setupBinanceClient, subscribeToPair, getCurrentTradingPair, disconnectTickerService } = require('./binance');
const { setupWebSocketServer, disconnectDepthStream } = require('./websocket');
const { setupRoutes } = require('./routes');
const { PORT, BINANCE_API_KEY, BINANCE_API_SECRET, BINANCE_BASE_URL, BINANCE_TRADING_PAIR } = require('./config');
const TickerService = require('./services/CryptoTickerService');
const { broadcast } = require('./utils');

/**
 * @type {express.Application}
 * @description The Express application instance.
 */
const app = express();
/**
 * @type {http.Server}
 * @description The HTTP server instance.
 */
const server = http.createServer(app);

// Middlewares
app.use(express.json());
app.use(cors());

/**
 * @type {Spot}
 * @description The Binance Spot API client instance.
 */
const client = setupBinanceClient(BINANCE_API_KEY, BINANCE_API_SECRET, BINANCE_BASE_URL);
/**
 * @type {WebSocketServer}
 * @description The WebSocket server instance.
 */
// Pass getCurrentTradingPair to setupWebSocketServer
const wss = setupWebSocketServer(server, (data) => broadcast(wss, data), subscribeToPair, getCurrentTradingPair);

// Setup routes
setupRoutes(app, client, TickerService, (data) => broadcast(wss, data));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(500).json({ error: 'An unexpected error occurred on the server.' });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Serveur HTTP écoutant sur http://localhost:${PORT}`);
  console.log(`Point de terminaison WebSocket: ws://localhost:${PORT}`);
  console.log(`Point de terminaison API REST: POST http://localhost:${PORT}/api/set-pair`);
  subscribeToPair(BINANCE_TRADING_PAIR, (data) => broadcast(wss, data), TickerService);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log("Arrêt du serveur...");
  disconnectTickerService();
  disconnectDepthStream();
  wss.close(() => {
    server.close(() => {
      console.log("Serveur arrêté.");
      process.exit(0);
    });
  });
});
