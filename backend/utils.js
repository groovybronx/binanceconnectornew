// utils.js
/**
 * @module utils
 * @description Module for utility functions.
 */

/**
 * @function broadcast
 * @description Broadcasts data to all connected WebSocket clients.
 * @param {WebSocketServer} wss - The WebSocket server instance.
 * @param {object} data - The data to broadcast.
 */
function broadcast(wss, data) {
    const jsonData = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(jsonData);
      }
    });
  }
  
  module.exports = { broadcast };
  