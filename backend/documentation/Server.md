# Documentation : backend/server.js

**Date de Génération :** Samedi 5 avril 2025 à 01:40 CEST

## 1. Description Générale

Ce script Node.js met en place un serveur backend qui remplit plusieurs rôles :
1.  **Serveur HTTP Express :** Sert de base pour l'application et expose une API REST.
2.  **Serveur WebSocket (`ws`) :** Communique en temps réel avec les clients frontend connectés (par exemple, pour diffuser les prix des cryptomonnaies).
3.  **Client WebSocket (`@binance/connector`) :** Se connecte à l'API WebSocket de Binance pour recevoir les données de marché en temps réel (spécifiquement le flux MiniTicker).
4.  **API REST :** Expose un point de terminaison (`/api/set-pair`) permettant aux clients (via HTTP) de demander au backend de changer la paire de trading suivie sur Binance.
5.  **Gestion d'État Simple :** Maintient la paire de trading actuellement suivie (`currentTradingPair`) et le nom du flux WebSocket Binance correspondant (`currentStreamName`).

L'objectif principal est de récupérer les données de prix d'une paire de trading spécifique depuis Binance et de les diffuser aux clients frontend, tout en permettant à ces clients de changer la paire suivie via une requête API.

## 2. Dépendances

* **`dotenv` :** Charge les variables d'environnement depuis un fichier `.env`.
* **`express` :** Framework web pour Node.js, utilisé pour le serveur HTTP et l'API REST.
* **`http` :** Module Node.js natif pour créer le serveur HTTP.
* **`ws` :** Bibliothèque pour implémenter le serveur WebSocket (communication Backend <-> Frontend).
* **`@binance/connector` :** Bibliothèque officielle de Binance pour interagir avec leurs API (REST et WebSocket). Utilisée ici pour le client WebSocket vers Binance.
* **`cors` :** Middleware Express pour gérer les Cross-Origin Resource Sharing (permet au frontend servi sur une origine différente d'accéder à l'API).

## 3. Configuration (`.env`)

Le serveur utilise les variables d'environnement suivantes, généralement définies dans un fichier `.env` à la racine du dossier `backend/` :

* `PORT` : Le port sur lequel le serveur HTTP écoutera (par défaut : `8080`).
* `BINANCE_TRADING_PAIR` : La paire de trading initiale à suivre au démarrage du serveur (par défaut : `BTCUSDT`).

## 4. Fonctionnalités Principales

### 4.1. Serveur HTTP (Express)
* Initialise une application Express.
* Utilise les middlewares `express.json()` (pour parser les corps de requête JSON entrants sur l'API) et `cors()` (pour autoriser les requêtes cross-origin).
* Expose une route racine `GET /` simple pour vérifier si le serveur est actif.
* Expose la route `POST /api/set-pair` (voir section API REST).
* Sert de base pour le serveur WebSocket.

### 4.2. Serveur WebSocket (pour le Frontend)
* Créé avec la bibliothèque `ws` et attaché au serveur HTTP Express.
* Écoute les connexions entrantes des clients frontend sur `ws://localhost:[PORT]`.
* **Gestion des Connexions (`wss.on('connection', ...)`):**
    * Lorsqu'un nouveau client se connecte, le serveur lui envoie immédiatement la configuration actuelle (la paire suivie) via un message `{ type: 'config', pair: currentTradingPair }`.
    * Il n'écoute plus les messages `subscribe` venant du frontend via WebSocket (cette logique passe par l'API REST). Les messages inattendus sont loggués.
    * Gère la déconnexion (`close`) et les erreurs (`error`) des clients.
* **Diffusion (`broadcast` function):** Une fonction utilitaire pour envoyer un message JSON à **tous** les clients WebSocket connectés et actifs.

### 4.3. Client WebSocket (vers Binance)
* Utilise `WebsocketStream` de `@binance/connector` pour se connecter aux serveurs WebSocket de Binance.
* **Callbacks (`binanceCallbacks`):**
    * `open`: Loggue la connexion réussie à Binance.
    * `close`: Loggue la déconnexion de Binance.
    * `message`: Traite les messages reçus de Binance :
        * Parse le message JSON.
        * Vérifie si c'est un message `24hrMiniTicker`.
        * Vérifie si le symbole (`ticker.s`) correspond à la `currentTradingPair` suivie par le backend.
        * Si oui, calcule le pourcentage de changement sur 24h manuellement (en utilisant `ticker.c` - prix actuel et `ticker.o` - prix 24h).
        * Formate un objet `priceUpdate` contenant le type, la paire, le prix, le pourcentage de changement calculé et le timestamp.
        * Appelle `broadcast` pour envoyer cet objet `priceUpdate` à tous les clients frontend connectés.
* **Gestion des Abonnements (`subscribeToPair` function):**
    * Fonction centrale pour changer ou établir l'abonnement au flux Binance.
    * Prend un `pairSymbol` en argument.
    * Construit le nom du flux (ex: `btcusdt@miniTicker`).
    * Se **désabonne** de l'ancien `currentStreamName` si un abonnement était actif.
    * Met à jour les variables d'état `currentTradingPair` et `currentStreamName`.
    * S'**abonne** au nouveau `newStreamName` via `binanceWsClient.subscribe()`.
    * Appelle `broadcast` pour envoyer un message `{ type: 'config', pair: currentTradingPair }` à tous les clients frontend, les informant de la paire désormais suivie.

### 4.4. API REST (`/api/set-pair`)
* **Route :** `POST /api/set-pair`
* **Objectif :** Permettre à un client HTTP (comme le composant `SearchPair.vue`) de demander au backend de changer la paire de trading suivie.
* **Fonctionnement :**
    * Attend un corps de requête JSON contenant `{ "pair": "SYMBOLE" }`.
    * Valide la présence et le format du symbole `pair`.
    * Si la paire est valide et différente de `currentTradingPair`, appelle la fonction `subscribeToPair()` pour effectuer le changement d'abonnement côté Binance et notifier les clients WebSocket.
    * Renvoie une réponse HTTP :
        * `200 OK` avec un message de succès si la paire est changée ou était déjà suivie.
        * `400 Bad Request` avec un message d'erreur si la paire est manquante ou invalide.
        * `500 Internal Server Error` si une erreur survient pendant le processus d'abonnement.

## 5. Flux de Données

* **Temps Réel :** Binance -> `binanceWsClient` (message) -> Callback `message` -> Calcul % -> `broadcast` -> Clients WebSocket Frontend (`CryptoTicker.vue`).
* **Changement de Paire :** Client HTTP (`SearchPair.vue`) -> `POST /api/set-pair` -> Handler Express -> Validation -> `subscribeToPair` -> (Binance WS unsubscribe/subscribe) ET (`broadcast` config) -> Clients WebSocket Frontend (`CryptoTicker.vue`).

## 6. Variables d'État Globales (Backend)

* `currentTradingPair` (let): Stocke le symbole (en majuscules) de la paire de trading actuellement suivie (ex: "BTCUSDT"). Initialisée via `.env` ou par défaut. Modifiée par `subscribeToPair`.
* `currentStreamName` (let): Stocke le nom complet du flux WebSocket Binance actuellement écouté (ex: "btcusdt@miniTicker"). Initialisé à `null`. Modifié par `subscribeToPair`. Utilisé pour la désinscription.

## 7. Gestion des Erreurs

* Les erreurs de parsing JSON dans les callbacks WebSocket (Binance et Frontend) sont interceptées avec `try...catch`.
* Les erreurs de connexion WebSocket client sont logguées.
* L'API REST `/api/set-pair` renvoie des codes de statut HTTP appropriés (400, 500) avec des messages d'erreur JSON en cas de problème.
* La validation du format de la paire est basique mais présente.

## 8. Points d'Entrée

* **Serveur HTTP :** `http://localhost:[PORT]` (où `PORT` est défini dans `.env` ou 8080)
* **Serveur WebSocket :** `ws://localhost:[PORT]`
* **API REST :** `POST http://localhost:[PORT]/api/set-pair`

## 9. Démarrage

Le serveur est lancé via la commande (généralement définie dans `package.json`) :

```bash
npm start
# ou
node server.js