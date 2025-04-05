Ok, voici une documentation détaillée pour le composant `CryptoTicker.vue`.

---

## Documentation du Composant : `CryptoTicker.vue`

**Date de Génération :** Samedi 5 avril 2025

### 1. Aperçu

`CryptoTicker.vue` est un composant Vue 3 (utilisant `<script setup>`) conçu pour afficher en temps réel les informations de prix d'une paire de trading de cryptomonnaie. Il se connecte via WebSocket à un serveur backend (attendu sur `ws://localhost:8080`) qui lui fournit les mises à jour de prix.

Le composant affiche :

* Le nom de la paire de trading.
* Le dernier prix connu.
* Le pourcentage de changement sur 24h (si fourni par le backend).
* L'heure de la dernière mise à jour.
* L'état de la connexion WebSocket au backend.
* Indicateurs visuels (couleur du prix/pourcentage) pour montrer si le prix monte ou baisse.

### 2. Fonctionnement

* **Connexion WebSocket :** Au montage (`onMounted`), le composant initialise une connexion WebSocket vers l'URL `ws://localhost:8080`.
* **Réception des Données :** Il écoute les messages entrants (`onmessage`) du serveur WebSocket backend.
    * Un message de type `config` est attendu au début pour définir la `tradingPair`.
    * Les messages de type `priceUpdate` contiennent les nouvelles informations (`pair`, `price`, `changePercent`, `timestamp`) qui mettent à jour l'état réactif du composant.
* **Gestion d'État :** L'état de la connexion (`connectionStatus`) et les données de prix (`currentPrice`, `priceChangePercent`, etc.) sont stockés dans des `ref` réactifs de Vue.
* **Affichage Dynamique :** Le template utilise des propriétés calculées (`computed`) pour formater les données (prix, timestamp) et déterminer les classes CSS (pour la couleur `up`/`down` et l'état de connexion).
* **Nettoyage :** À la destruction du composant (`onUnmounted`), la connexion WebSocket est proprement fermée pour éviter les fuites de mémoire.

### 3. État (Refs Réactifs)

Les variables suivantes maintiennent l'état interne du composant :

* `tradingPair: ref('Loading...')`: Stocke le symbole de la paire de trading (ex: "BTCUSDT"). Mise à jour par le message `config` du backend.
* `currentPrice: ref(null)`: Stocke le dernier prix reçu du backend.
* `priceChangePercent: ref(null)`: Stocke le pourcentage de changement sur 24h reçu du backend.
* `lastUpdate: ref(null)`: Stocke le timestamp (en millisecondes) de la dernière mise à jour reçue.
* `connectionStatus: ref('Connecting')`: Chaîne de caractères indiquant l'état actuel de la connexion WebSocket ("Connecting", "Connected", "Error", "Closed").
* `ws: ref(null)`: Contient l'instance de l'objet `WebSocket` une fois la connexion établie.
* `lastPrice: let (non-réactif)`: Variable simple utilisée pour stocker la valeur précédente de `currentPrice` afin de déterminer la classe `up`/`down` si `priceChangePercent` n'est pas disponible.

### 4. Propriétés Calculées (Computed Properties)

Ces propriétés dérivent leur valeur de l'état réactif :

* `isConnected: computed(() => ...)`: Renvoie `true` si `connectionStatus` est "Connected". Utilisée pour appliquer la classe CSS `.connected`.
* `hasError: computed(() => ...)`: Renvoie `true` si `connectionStatus` est "Error". Utilisée pour appliquer la classe CSS `.error`.
* `formattedPrice: computed(() => ...)`: Formate `currentPrice` en une chaîne de caractères locale (ex: "16,628.10") avec deux décimales. Renvoie '-' si `currentPrice` est `null`.
* `priceClass: computed(() => ...)`: Détermine la classe CSS à appliquer au prix et au pourcentage. Renvoie 'up' si le pourcentage de changement est positif ou si le prix actuel est >= au `lastPrice`. Renvoie 'down' sinon. Se base sur `priceChangePercent` si disponible, sinon sur la comparaison `currentPrice` vs `lastPrice`.
* `formattedTimestamp: computed(() => ...)`: Formate `lastUpdate` (timestamp) en une heure lisible (ex: "12:56:30 PM"). Renvoie '-' si `lastUpdate` est `null`.

### 5. Méthodes

* `connectWebSocket()`: Fonction principale qui :
    * Établit la connexion WebSocket vers `ws://localhost:8080`.
    * Définit les gestionnaires d'événements pour la connexion :
        * `onopen`: Met `connectionStatus` à "Connected".
        * `onmessage`: Parse les données JSON reçues. Met à jour `tradingPair` si le message est de type `config`. Met à jour `currentPrice`, `priceChangePercent`, `lastUpdate` et `lastPrice` si le message est de type `priceUpdate`.
        * `onerror`: Met `connectionStatus` à "Error" et log l'erreur.
        * `onclose`: Met `connectionStatus` à "Closed", log la raison et réinitialise `currentPrice`.

### 6. Cycle de Vie (Lifecycle Hooks)

* `onMounted(() => connectWebSocket())`: Appelle `connectWebSocket` pour démarrer la connexion dès que le composant est inséré dans le DOM.
* `onUnmounted(() => ws.value?.close())`: Assure la fermeture de la connexion WebSocket lorsque le composant est retiré du DOM.

### 7. Template (Structure HTML)

* La racine est une `div.crypto-ticker` dont la bordure gauche change de couleur selon l'état (`.connected` ou `.error`).
* Un titre `<h3>Realtime Ticker</h3>`.
* Affichage conditionnel :
    * Si la connexion n'est pas établie (`connectionStatus !== 'Connected'`), affiche le statut (ex: "Connecting...").
    * Si connecté mais `currentPrice` est encore `null`, affiche "Waiting for data...".
    * Si connecté et `currentPrice` a une valeur, affiche le bloc `.data`.
* Bloc `.data` : Affiche `tradingPair`, `formattedPrice`, `priceChangePercent` (si non `null`, avec signe '+' et '%'), et `formattedTimestamp`. Le prix et le pourcentage ont une classe dynamique (`priceClass`) pour la couleur.

### 8. Style (CSS)

* Les styles sont `scoped`, ce qui signifie qu'ils ne s'appliquent qu'à ce composant.
* Styles de base pour l'apparence de la "carte" du ticker (bordure, fond, ombre, etc.).
* Styles conditionnels pour la bordure gauche (`.connected`, `.error`).
* Styles pour les différents éléments textuels (taille, poids, couleur).
* Styles `.up` (vert) et `.down` (rouge) appliqués conditionnellement au prix et au pourcentage via `priceClass`. Des transitions CSS sont ajoutées pour des changements de couleur fluides.

### 9. Dépendances

* Vue 3 (Composition API : `ref`, `computed`, `onMounted`, `onUnmounted`).
* API WebSocket native du navigateur.

### 10. Utilisation

Ce composant est destiné à être utilisé dans une application Vue 3. Il suffit de l'importer et de l'inclure dans le template d'un composant parent.

```vue
<template>
  <div>
    <CryptoTicker />
  </div>
</template>

<script setup>
import CryptoTicker from './components/CryptoTicker.vue';
</script>
```

Il présuppose qu'un serveur backend WebSocket tourne sur `ws://localhost:8080` et envoie des messages avec la structure attendue (`{type: 'config', ...}` ou `{type: 'priceUpdate', ...}`).

---