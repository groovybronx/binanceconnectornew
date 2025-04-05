// backend/CryptoTickerService.js

/**
 * @fileoverview Service pour gérer le ticker de prix de crypto-monnaies en temps réel.
 * Ce service utilise la bibliothèque @binance/connector pour se connecter aux flux de données de Binance.
 * Il gère la connexion WebSocket à Binance et diffuse les mises à jour de prix aux clients connectés.
 *
 * @requires @binance/connector
 */
const { WebsocketStream } = require('@binance/connector');

/**
 * Objet contenant les fonctions de rappel (callbacks) pour le client WebSocket de Binance.
 *
 * @typedef {Object} BinanceCallbacks
 * @property {function} open - Fonction appelée lors de l'ouverture de la connexion.
 * @property {function} close - Fonction appelée lors de la fermeture de la connexion.
 * @property {function} message - Fonction appelée lors de la réception d'un message.
 */

/**
 * Objet contenant les informations de mise à jour du prix.
 *
 * @typedef {Object} PriceUpdate
 * @property {string} type - Le type de message ('priceUpdate').
 * @property {string} pair - La paire de trading (ex: BTCUSDT).
 * @property {string} price - Le prix actuel formaté.
 * @property {string} changePercent - Le pourcentage de changement formaté.
 * @property {number} timestamp - Le timestamp de la mise à jour.
 */

/**
 * Classe TickerService pour gérer le flux de données de Binance et la diffusion des mises à jour.
 */
class TickerService {
  /**
   * Crée une instance de TickerService.
   * @param {string} tradingPair - La paire de trading à suivre (ex: BTCUSDT).
   * @param {function} broadcast - La fonction à appeler pour diffuser les données aux clients.
   */
  constructor(tradingPair, broadcast) {
    this.tradingPair = tradingPair;
    this.broadcast = broadcast;
    this.binanceWsClient = null;
    this.streamName = `${this.tradingPair.toLowerCase()}@miniTicker`;
    this.initialize();
  }

  /**
   * Initialise le client WebSocket de Binance et s'abonne au stream.
   */
  initialize() {
    /** @type {BinanceCallbacks} */
    const binanceCallbacks = {
      open: () =>
        console.log(
          `Connecté au stream ${this.streamName} de Binance.`
        ),
      close: () => console.log(`Déconnecté du stream Binance.`),
      message: (data) => this.handleBinanceMessage(data),
    };

    this.binanceWsClient = new WebsocketStream({
      callbacks: binanceCallbacks,
    });
    this.subscribeToStream();
  }

  /**
   * S'abonne au stream de données de Binance.
   */
  subscribeToStream() {
    console.log(`Subscription au stream Binance: ${this.streamName}`);
    this.binanceWsClient.subscribe(this.streamName);
  }

  /**
   * Gère les messages reçus du stream Binance.
   * @param {string} data - Les données reçues de Binance.
   */
  handleBinanceMessage(data) {
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.e === '24hrMiniTicker') {
        const ticker = parsedData;

        const currentPrice = parseFloat(ticker.c);
        const openPrice = parseFloat(ticker.o);

        let percentChange = 0;
        if (openPrice !== 0) {
          percentChange = ((currentPrice - openPrice) / openPrice) * 100;
        }

        /** @type {PriceUpdate} */
        const priceUpdate = {
          type: 'priceUpdate',
          pair: ticker.s,
          price: currentPrice.toFixed(2),
          changePercent: percentChange.toFixed(2),
          timestamp: ticker.E,
        };

        console.log(
          `Update (miniTicker) ${priceUpdate.pair}: ${priceUpdate.price} (${priceUpdate.changePercent}%)`
        );
        this.broadcast(priceUpdate);
      }
    } catch (error) {
      console.error(
        'Erreur de parsing du message Binance:',
        error,
        'Data:',
        data
      );
    }
  }

  /**
   * Se déconnecte du stream de données de Binance.
   */
  disconnect() {
    if (this.binanceWsClient) {
      console.log("Déconnexion du stream Binance...");
      this.binanceWsClient.unsubscribeSymbolMiniTicker(this.tradingPair);
      this.binanceWsClient.disconnect();
      console.log("Déconnecté du stream Binance.");
    }
  }
}

module.exports = TickerService;
