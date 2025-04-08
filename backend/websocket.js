// websocket.js
/**
 * @module websocket
 * @description Module for managing WebSocket connections and Binance depth streams.
 */
const { WebSocketServer } = require('ws');
const { WebsocketStream } = require('@binance/connector');

/**
 * @type {WebsocketStream|null}
 * @description The Binance depth WebSocket client.
 */
let binanceDepthWsClient = null;

/**
 * @type {string|null}
 * @description The name of the current depth stream.
 */
let currentDepthStreamName = null;

/**
 * @function setupWebSocketServer
 * @description Sets up the WebSocket server and handles client connections.
 * @param {http.Server} server - The HTTP server instance.
 * @param {function} broadcast - The function to broadcast data to connected clients.
 * @param {function} subscribeToDepth - The function to subscribe to a depth stream.
 * @param {function} getCurrentTradingPair - A function that returns the current trading pair.
 * @returns {WebSocketServer} The WebSocket server instance.
 */
function setupWebSocketServer(server, broadcast, subscribeToDepth, getCurrentTradingPair) {
  /**
   * @type {WebSocketServer}
   * @description The WebSocket server instance.
   */
  const wss = new WebSocketServer({ server , broadcast, subscribeToDepth, getCurrentTradingPair });
  console.log('WebSocket server configuré et en attente de connexions...');
  // Écouter les connexions WebSocket.
  wss.on('listening', () => {
    console.log('WebSocket server en écoute sur le port:', server.address().port);
  });

  wss.on('connection', (ws) => {
    console.log('Client Frontend connecté au backend via WebSocket');
    // Envoyer config initiale.
    const currentPair = getCurrentTradingPair(); // Get the current pair using the provided function
    ws.send(JSON.stringify({ type: 'config', pair: currentPair }));
    ws.on('message', (message) => {
      console.warn(`Message inattendu reçu sur WebSocket: ${message.toString()}`);
    });
    ws.on('close', () => console.log('Client Frontend déconnecté (WebSocket)'));
    ws.on('error', (error) => console.error('Erreur WebSocket client:', error));
  });

  return wss;
}

/**
 * @function subscribeToDepth
 * @description Subscribes to the Binance depth stream for a given trading pair.
 * @param {string} pairSymbol - The trading pair symbol (e.g., 'BTCUSDT').
 * @param {function} broadcast - The function to broadcast data to connected clients.
 */
function subscribeToDepth(pairSymbol, broadcast) {
  const newPairUpper = pairSymbol.toUpperCase();
  const newDepthStreamName = `${newPairUpper.toLowerCase()}@depth@100ms`;

  if (currentDepthStreamName) {
    console.log(`Backend: Se désabonne de ${currentDepthStreamName}`);
    binanceDepthWsClient.unsubscribe(currentDepthStreamName);
  }

  currentDepthStreamName = newDepthStreamName;
  console.log(`Backend: S'abonne à ${currentDepthStreamName}`);

  /**
   * @typedef {Object} DepthCallbacks
   * @property {function} open - Callback function when the connection is open.
   * @property {function} close - Callback function when the connection is closed.
   * @property {function} message - Callback function when a message is received.
   */
  /**
   * @type {DepthCallbacks}
   * @description Callbacks for the depth stream.
   */
  const depthCallbacks = {
    open: () => console.log(`Connecté au stream de profondeur ${currentDepthStreamName} de Binance.`),
    close: () => console.log(`Déconnecté du stream de profondeur Binance.`),
    message: (data) => {
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.e === 'depthUpdate') {
          const depthUpdate = {
            type: 'depthUpdate',
            pair: parsedData.s,
            bids: parsedData.b,
            asks: parsedData.a,
          };
          broadcast(depthUpdate);
        }
      } catch (error) {
        console.error('Erreur parsing message de profondeur Binance:', error);
      }
    },
  };

  binanceDepthWsClient = new WebsocketStream({ callbacks: depthCallbacks });
  binanceDepthWsClient.subscribe(currentDepthStreamName);
}

/**
 * @function disconnectDepthStream
 * @description Unsubscribes from the current depth stream and disconnects the WebSocket client.
 */
function disconnectDepthStream() {
  if (currentDepthStreamName) {
    binanceDepthWsClient.unsubscribe(currentDepthStreamName);
  }
  binanceDepthWsClient.disconnect();
}

module.exports = { setupWebSocketServer, subscribeToDepth, disconnectDepthStream };
