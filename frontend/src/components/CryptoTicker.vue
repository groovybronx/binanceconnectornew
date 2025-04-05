<template>
  <div class="crypto-ticker" :class="{ connected: isConnected, error: hasError }">
    <h3>Realtime Ticker</h3>
    <div v-if="connectionStatus !== 'Connected'" class="status">
      {{ connectionStatus }}...
    </div>
    <div v-else-if="currentPrice" class="data">
      <div class="pair">{{ tradingPair }}</div>
      <div class="price" :class="priceClass">
        {{ formattedPrice }}
      </div>
      <div v-if="priceChangePercent !== null" class="change" :class="priceClass">
        ({{ priceChangePercent > 0 ? '+' : '' }}{{ priceChangePercent }}%)
      </div>
      <div class="timestamp">Last update: {{ formattedTimestamp }}</div>
    </div>
    <div v-else class="status">
      Waiting for data...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

/**
 * @fileoverview Composant Vue pour afficher un ticker de prix de crypto-monnaie en temps réel.
 * Ce composant se connecte à un serveur WebSocket pour recevoir les mises à jour de prix.
 */

/**
 * @typedef {Object} PriceData
 * @property {string} pair - La paire de trading (ex: BTCUSDT).
 * @property {string} price - Le prix actuel formaté.
 * @property {string} changePercent - Le pourcentage de changement formaté.
 * @property {number} timestamp - Le timestamp de la dernière mise à jour.
 */

/**
 * @typedef {Object} ConfigData
 * @property {string} pair - La paire de trading (ex: BTCUSDT).
 */

/**
 * @type {ref<string>} - La paire de trading actuelle. Initialisée à 'Loading...' avant la réception des données.
 */
const tradingPair = ref('Loading...');

/**
 * @type {ref<string|null>} - Le prix actuel de la crypto-monnaie. Initialisé à null.
 */
const currentPrice = ref(null);

/**
 * @type {ref<string|null>} - Le pourcentage de changement de prix. Initialisé à null.
 * Reçu du backend via le stream MiniTicker.
 */
const priceChangePercent = ref(null);

/**
 * @type {ref<number|null>} - Le timestamp de la dernière mise à jour. Initialisé à null.
 */
const lastUpdate = ref(null);

/**
 * @type {ref<string>} - Le statut de la connexion WebSocket.
 * Peut être 'Connecting', 'Connected', 'Error', ou 'Closed'.
 */
const connectionStatus = ref('Connecting');

/**
 * @type {ref<WebSocket|null>} - L'instance WebSocket. Initialisée à null.
 */
const ws = ref(null);

/**
 * @type {number} - Le dernier prix connu, utilisé pour déterminer la direction du changement.
 * Initialisé à 0.
 */
let lastPrice = 0;

/**
 * @type {computed<boolean>} - Indique si la connexion WebSocket est établie.
 * Vrai si `connectionStatus` est 'Connected', faux sinon.
 */
const isConnected = computed(() => connectionStatus.value === 'Connected');

/**
 * @type {computed<boolean>} - Indique si une erreur s'est produite lors de la connexion WebSocket.
 * Vrai si `connectionStatus` est 'Error', faux sinon.
 */
const hasError = computed(() => connectionStatus.value === 'Error');

/**
 * @type {computed<string>} - Le prix actuel formaté pour l'affichage.
 * Utilise `toLocaleString` pour un formatage de devise avec 2 décimales.
 * Retourne '-' si `currentPrice` est null.
 */
const formattedPrice = computed(() => {
  if (currentPrice.value === null) return '-';
  return parseFloat(currentPrice.value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

/**
 * @type {computed<string>} - La classe CSS à appliquer au prix et au pourcentage de changement.
 * Détermine la classe 'up' ou 'down' en fonction du pourcentage de changement ou de la comparaison avec le dernier prix.
 * Retourne une chaîne vide si les données sont insuffisantes.
 */
const priceClass = computed(() => {
  if (priceChangePercent.value !== null) {
    // Utilise le % de changement s'il est fourni (MiniTicker)
    return parseFloat(priceChangePercent.value) >= 0 ? 'up' : 'down';
  } else {
    // Sinon, compare le prix actuel au dernier prix connu (Kline)
    if (currentPrice.value === null || lastPrice === null) return '';
    return parseFloat(currentPrice.value) >= lastPrice ? 'up' : 'down';
  }
});

/**
 * @type {computed<string>} - Le timestamp de la dernière mise à jour formaté pour l'affichage.
 * Utilise `toLocaleTimeString` pour un formatage d'heure local.
 * Retourne '-' si `lastUpdate` est null.
 */
const formattedTimestamp = computed(() => {
  if (!lastUpdate.value) return '-';
  return new Date(lastUpdate.value).toLocaleTimeString();
});

/**
 * Connecte le composant au serveur WebSocket.
 * Gère les événements `onopen`, `onmessage`, `onerror`, et `onclose`.
 */
const connectWebSocket = () => {
  const backendWsUrl = 'ws://localhost:8080';
  console.log(`Attempting to connect to WebSocket backend at ${backendWsUrl}`);
  ws.value = new WebSocket(backendWsUrl);

  /**
   * Gère l'ouverture de la connexion WebSocket.
   * Met à jour `connectionStatus` à 'Connected'.
   */
  ws.value.onopen = () => {
    console.log('WebSocket connection to backend established.');
    connectionStatus.value = 'Connected';
  };

  /**
   * Gère les messages reçus du serveur WebSocket.
   * Met à jour les données de prix, la paire de trading, et le timestamp.
   * @param {MessageEvent} event - L'événement de message reçu.
   */
  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'config') {
        /** @type {ConfigData} */
        const configData = data;
        tradingPair.value = configData.pair;
        console.log(`Trading pair set to: ${tradingPair.value}`);
      } else if (data.type === 'priceUpdate') {
        /** @type {PriceData} */
        const priceData = data;
        lastPrice = currentPrice.value;
        currentPrice.value = priceData.price; // Reçu déjà formaté du backend
        tradingPair.value = priceData.pair;
        lastUpdate.value = priceData.timestamp;
        // Assignez directement la valeur reçue (déjà calculée et formatée par le backend)
        priceChangePercent.value = priceData.changePercent;
      }
    } catch (error) {
      console.error('Failed to parse message or update state:', error);
    }
  };

  /**
   * Gère les erreurs de connexion WebSocket.
   * Met à jour `connectionStatus` à 'Error'.
   * @param {Event} error - L'événement d'erreur.
   */
  ws.value.onerror = (error) => {
    console.error('WebSocket Error:', error);
    connectionStatus.value = 'Error';
  };

  /**
   * Gère la fermeture de la connexion WebSocket.
   * Met à jour `connectionStatus` à 'Closed' et réinitialise `currentPrice`.
   * @param {CloseEvent} event - L'événement de fermeture.
   */
  ws.value.onclose = (event) => {
    console.log(
      'WebSocket connection closed:',
      event.reason || `Code ${event.code}`
    );
    connectionStatus.value = `Closed (${event.code})`;
    currentPrice.value = null; // Réinitialiser les données
    // Optionnel: tenter une reconnexion après un délai
    // setTimeout(connectWebSocket, 5000);
  };
};

/**
 * Se connecte au serveur WebSocket lorsque le composant est monté.
 */
onMounted(() => {
  connectWebSocket();
});

/**
 * Ferme la connexion WebSocket lorsque le composant est démonté.
 */
onUnmounted(() => {
  if (ws.value) {
    console.log('Closing WebSocket connection from frontend.');
    ws.value.close();
  }
});
</script>

<style scoped>
.crypto-ticker {
  font-family: sans-serif;
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 8px;
  min-width: 250px;
  background-color: #f9f9f9;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s ease;
}

.crypto-ticker.connected {
  border-left: 5px solid #4caf50; /* Vert si connecté */
}
.crypto-ticker.error {
  border-left: 5px solid #f44336; /* Rouge si erreur */
}

h3 {
  margin-top: 0;
  color: #333;
  text-align: center;
  margin-bottom: 15px;
}

.status {
  text-align: center;
  color: #888;
}

.data {
  text-align: center;
}

.pair {
  font-size: 1.2em;
  font-weight: bold;
  color: #555;
  margin-bottom: 5px;
}

.price {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 5px;
  transition: color 0.3s ease;
}

.change {
  font-size: 1em;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.price.up,
.change.up {
  color: #4caf50; /* Vert */
}

.price.down,
.change.down {
  color: #f44336; /* Rouge */
}

.timestamp {
  font-size: 0.8em;
  color: #aaa;
}
</style>
