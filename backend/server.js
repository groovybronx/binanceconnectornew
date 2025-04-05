// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { WebsocketStream } = require('@binance/connector');
const cors = require('cors');
const { Spot } = require('@binance/connector');
const TickerService = require('./services/CryptoTickerService');

const apiKey = process.env.BINANCE_API_KEY;
const apiSecret = process.env.BINANCE_API_SECRET;
const client = new Spot(apiKey, apiSecret, options = { baseURL: 'https://testnet.binance.vision' });

const app = express();

// Middleware pour parser le JSON des requêtes HTTP
app.use(express.json());
// Activer CORS pour toutes les routes
app.use(cors());

const PORT = process.env.PORT || 8080;
let currentTradingPair = (process.env.BINANCE_TRADING_PAIR || 'BTCUSDT').toUpperCase();
let currentStreamName = null;
let currentDepthStreamName = null;
let binanceDepthWsClient = null;
let tickerService = null;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

console.log(`Serveur WebSocket Backend démarré sur le port ${PORT}`);

// --- Fonctions de gestion des diffusions WebSocket ---
const broadcast = (data) => {
    const jsonData = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(jsonData);
        }
    });
};

// --- Fonctions de gestion du stream de profondeur ---
function subscribeToDepth(pairSymbol) {
    const newPairUpper = pairSymbol.toUpperCase();
    const newDepthStreamName = `${newPairUpper.toLowerCase()}@depth@100ms`;

    if (currentDepthStreamName) {
        console.log(`Backend: Se désabonne de ${currentDepthStreamName}`);
        binanceDepthWsClient.unsubscribe(currentDepthStreamName);
    }

    currentDepthStreamName = newDepthStreamName;
    console.log(`Backend: S'abonne à ${currentDepthStreamName}`);

    const depthCallbacks = {
        open: () => console.log(`Connecté au stream de profondeur ${currentDepthStreamName} de Binance.`),
        close: () => console.log(`Déconnecté du stream de profondeur Binance.`),
        message: (data) => {
            try {
                const parsedData = JSON.parse(data);
                // Vérifier si le message est bien un message de profondeur
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
        }
    };

    binanceDepthWsClient = new WebsocketStream({ callbacks: depthCallbacks });
    binanceDepthWsClient.subscribe(currentDepthStreamName);
}

// --- Fonctions de gestion du stream de prix ---
function subscribeToPair(pairSymbol) {
    const newPairUpper = pairSymbol.toUpperCase();
    if (tickerService) {
        tickerService.disconnect();
    }
    currentTradingPair = newPairUpper;
    tickerService = new TickerService(currentTradingPair, broadcast);
    // Confirmer via WebSocket à tous les clients (CryptoTicker écoute ici)
    broadcast({ type: 'config', pair: currentTradingPair });
    subscribeToDepth(currentTradingPair);
}

// --- Gestion des connexions WebSocket Frontend ---
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

// --- Routes API HTTP ---
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

app.get('/api/balance/:pair', async (req, res) => {
    const requestedPair = req.params.pair.toUpperCase().trim();
    console.log(`Backend: Requête HTTP reçue sur /api/balance/${requestedPair}`);
    try {
        const baseAsset = requestedPair.replace('USDT', ''); // Assuming USDT as quote currency
        const quoteAsset = 'USDT';
        const accountData = await client.account();
        const balances = accountData.data.balances;

        const baseBalance = balances.find(b => b.asset === baseAsset);
        const quoteBalance = balances.find(b => b.asset === quoteAsset);

        if (baseBalance && quoteBalance) {
            res.json({
                base: { asset: baseBalance.asset, free: baseBalance.free, locked: baseBalance.locked },
                quote: { asset: quoteBalance.asset, free: quoteBalance.free, locked: quoteBalance.locked }
            });
        } else if (baseBalance) {
            res.json({
                base: { asset: baseBalance.asset, free: baseBalance.free, locked: baseBalance.locked },
                quote: { asset: quoteAsset, free: 0, locked: 0 }
            });
        } else if (quoteBalance) {
            res.json({
                base: { asset: baseAsset, free: 0, locked: 0 },
                quote: { asset: quoteBalance.asset, free: quoteBalance.free, locked: quoteBalance.locked }
            });
        }
        else {
            res.status(404).json({ error: `Balances non trouvées pour ${baseAsset} et ${quoteAsset}` });
        }
    } catch (error) {
        console.error("Backend: Erreur lors de la récupération de la balance:", error);
        res.status(500).json({ error: "Erreur lors de la récupération de la balance." });
    }
});
app.post('/api/place-order', async (req, res) => {
    const orderData = req.body;
    console.log(`Backend: Requête HTTP reçue sur /api/place-order pour:`, orderData);

    // Basic validation
    if (!orderData.pair || !orderData.side || !orderData.type || !orderData.quantity) {
        console.error("Backend: Erreur de validation - Paramètres manquants.");
        return res.status(400).json({ error: 'Missing required order parameters.' });
    }
    if (orderData.type === 'LIMIT' && !orderData.price) {
        console.error("Backend: Erreur de validation - Prix manquant pour ordre LIMIT.");
        return res.status(400).json({ error: 'Missing required order parameters for LIMIT order.' });
    }
    // Check if orderData.pair is a string
    if (typeof orderData.pair !== 'string') {
        console.error("Backend: Erreur de validation - Paire invalide.");
        return res.status(400).json({ error: 'Invalid pair.' });
    }

    try {
        // Explicitly convert quantity and price to numbers
        const quantity = Number(orderData.quantity);
        const price = orderData.type === 'LIMIT' ? Number(orderData.price) : null;

        // Check if the conversion was successful
        if (isNaN(quantity) || (orderData.type === 'LIMIT' && isNaN(price))) {
            console.error("Backend: Erreur de validation - Quantité ou prix invalide.");
            return res.status(400).json({ error: 'Invalid quantity or price.' });
        }

        const params = {
            symbol: orderData.pair,
            side: orderData.side,
            type: orderData.type,
            quantity: quantity, // Use the converted quantity
        };
        if (orderData.type === 'LIMIT') {
            params.price = price; // Use the converted price
            params.timeInForce = 'GTC';
        }

        console.log("Backend: Paramètres de l'ordre envoyés à Binance:", params);

        const orderResponse = await client.newOrder(params);
        console.log('Backend: Order response:', orderResponse.data);
        res.status(200).json({ message: 'Order placed successfully!', order: orderResponse.data });
    } catch (error) {
        console.error("Backend: Erreur lors du placement de l'ordre:", error);
        console.error("Backend: Détails de l'erreur:", JSON.stringify(error));
        if (error.response) {
            console.error("Backend: Réponse d'erreur de Binance:", error.response.data);
        }
        res.status(500).json({ error: error.message || "Error placing order." });
    }
});// --- Démarrage du serveur HTTP et abonnement initial WS Binance ---
server.listen(PORT, () => {
    console.log(`Serveur HTTP écoutant sur http://localhost:${PORT}`);
    console.log(`Point de terminaison WebSocket: ws://localhost:${PORT}`);
    console.log(`Point de terminaison API REST: POST http://localhost:${PORT}/api/set-pair`);
    subscribeToPair(currentTradingPair); // Abonnement initial
});

// --- Route Express simple ---
app.get('/', (req, res) => {
    res.send(`Serveur Realtime Crypto Ticker est actif. Paire actuelle: ${currentTradingPair}.`);
});


// --- Gestion de l'arrêt propre ---
process.on('SIGINT', () => {
    console.log("Arrêt du serveur...");
    if (tickerService) {
        tickerService.disconnect();
    }
    if (currentDepthStreamName) {
        binanceDepthWsClient.unsubscribe(currentDepthStreamName);
    }
    binanceDepthWsClient.disconnect();
    wss.close(() => {
        server.close(() => {
            console.log("Serveur arrêté.");
            process.exit(0);
        });
    });
});
