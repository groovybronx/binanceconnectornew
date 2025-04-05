// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { WebsocketStream } = require('@binance/connector');
const cors = require('cors');

const app = express();

// **Nouveau : Middleware pour parser le JSON des requêtes HTTP**
app.use(express.json());
// Activer CORS pour toutes les routes (y compris notre nouvelle API)
app.use(cors());

const PORT = process.env.PORT || 8080;
let currentTradingPair = (process.env.BINANCE_TRADING_PAIR || 'BTCUSDT').toUpperCase();
let currentStreamName = null;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

console.log(`Serveur WebSocket Backend démarré sur le port ${PORT}`);

// --- Client WebSocket Binance et fonctions associées ---
// (broadcast, binanceCallbacks, binanceWsClient, subscribeToPair restent les mêmes que dans la réponse précédente)

const broadcast = (data) => {
  const jsonData = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(jsonData);
    }
  });
};

const binanceCallbacks = {
    open: () => console.log(`Connecté à Binance WS.`),
    close: () => console.log(`Déconnecté de Binance WS.`),
    message: (data) => {
        try {
            const parsedData = JSON.parse(data);
            if (parsedData.e === '24hrMiniTicker') {
                 const ticker = parsedData;
                if (ticker.s.toUpperCase() === currentTradingPair) {
                    const currentPrice = parseFloat(ticker.c);
                    const openPrice = parseFloat(ticker.o);
                    let percentChange = 0;
                    if (openPrice !== 0) {
                        percentChange = ((currentPrice - openPrice) / openPrice) * 100;
                    }
                    const priceUpdate = { type: 'priceUpdate', pair: ticker.s, price: currentPrice.toFixed(2), changePercent: percentChange.toFixed(2), timestamp: ticker.E };
                    broadcast(priceUpdate);
                }
            }
        } catch (error) { console.error('Erreur parsing message Binance:', error); }
    }
};

const binanceWsClient = new WebsocketStream({ callbacks: binanceCallbacks });

function subscribeToPair(pairSymbol) {
    const newPairUpper = pairSymbol.toUpperCase();
    const newStreamName = `${newPairUpper.toLowerCase()}@miniTicker`;
    if (currentStreamName) {
        console.log(`Backend: Se désabonne de ${currentStreamName}`);
        binanceWsClient.unsubscribe(currentStreamName);
    }
    currentTradingPair = newPairUpper;
    currentStreamName = newStreamName;
    console.log(`Backend: S'abonne à ${currentStreamName}`);
    binanceWsClient.subscribe(currentStreamName);
    // Confirmer via WebSocket à tous les clients (CryptoTicker écoute ici)
    broadcast({ type: 'config', pair: currentTradingPair });
}

// --- Gestion des connexions WebSocket Frontend ---
// (wss.on('connection', ...) reste le même, mais il ne recevra plus de message 'subscribe')
wss.on('connection', (ws) => {
  console.log('Client Frontend connecté au backend via WebSocket');
  ws.send(JSON.stringify({ type: 'config', pair: currentTradingPair })); // Envoyer config initiale
  ws.on('message', (message) => {
      console.warn(`Message inattendu reçu sur WebSocket: ${message.toString()}`);
      // On ne gère plus les messages 'subscribe' ici
  });
  ws.on('close', () => console.log('Client Frontend déconnecté (WebSocket)'));
  ws.on('error', (error) => console.error('Erreur WebSocket client:', error));
});


// --- **Nouvelle Route API HTTP pour changer la paire** ---
app.post('/api/set-pair', (req, res) => {
    const requestedPair = req.body?.pair?.toUpperCase().trim(); // Utiliser optional chaining
    console.log(`Backend: Requête HTTP reçue sur /api/set-pair pour: ${requestedPair}`);

    if (!requestedPair) {
        return res.status(400).json({ error: 'Le champ "pair" est manquant dans la requête.' });
    }

    // Validation (identique à avant)
    if (!/^[A-Z]{3,}[A-Z]{3,}$/.test(requestedPair)) {
        console.warn(`Backend: Format de paire invalide demandé via API: ${requestedPair}`);
        return res.status(400).json({ error: 'Format de paire invalide.' });
    }

    // Si la paire est valide et différente, on la change
    if (requestedPair !== currentTradingPair) {
        try {
            console.log(`Backend: Changement de paire demandé via API pour: ${requestedPair}`);
            subscribeToPair(requestedPair); // Réutilise notre fonction interne
            // Répondre succès au client HTTP
            return res.status(200).json({ message: 'Abonnement à la paire mis à jour.', pair: requestedPair });
        } catch (error) {
             console.error("Backend: Erreur lors du changement d'abonnement via API:", error);
             return res.status(500).json({ error: "Erreur interne lors du changement d'abonnement." });
        }
    } else {
        console.log(`Backend: Paire demandée via API déjà suivie: ${requestedPair}`);
        // Paire déjà suivie, répondre succès quand même
        return res.status(200).json({ message: 'Paire déjà suivie.', pair: requestedPair });
    }
});


// Démarrer le serveur HTTP et abonnement initial WS Binance
server.listen(PORT, () => {
  console.log(`Serveur HTTP écoutant sur http://localhost:${PORT}`);
  console.log(`Point de terminaison WebSocket: ws://localhost:${PORT}`);
  console.log(`Point de terminaison API REST: POST http://localhost:${PORT}/api/set-pair`);
  subscribeToPair(currentTradingPair); // Abonnement initial
});

// Route Express simple (inchangée)
app.get('/', (req, res) => {
  res.send(`Serveur Realtime Crypto Ticker est actif. Paire actuelle: ${currentTradingPair}.`);
});

// Gestion de l'arrêt propre (inchangée)
process.on('SIGINT', () => {
  console.log("Arrêt du serveur...");
  if (currentStreamName) {
      binanceWsClient.unsubscribe(currentStreamName);
  }
  binanceWsClient.disconnect();
  wss.close(() => {
      server.close(() => {
          console.log("Serveur arrêté.");
          process.exit(0);
      });
  });
});