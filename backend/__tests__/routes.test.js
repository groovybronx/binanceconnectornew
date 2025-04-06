// __tests__/routes.test.js
const request = require('supertest');
const express = require('express');
const { setupRoutes } = require('../routes');
const { setupBinanceClient, getCurrentTradingPair } = require('../binance');
const TickerService = require('../services/CryptoTickerService');


jest.mock('../binance');
jest.mock('../services/CryptoTickerService');
jest.mock('../routes/orderRoutes');

describe('Routes Module', () => {
  let app;
  let client;
  const mockBroadcast = jest.fn();

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Mock setupBinanceClient to return an object with account and newOrder methods
    client = {
      account: jest.fn(),
    };
    setupBinanceClient.mockReturnValue(client);
    // Mock getCurrentTradingPair to return a value
    getCurrentTradingPair.mockReturnValue('BTCUSDT');
    setupRoutes(app, client, TickerService, mockBroadcast);
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POST /api/set-pair devrait retourner une erreur si la paire est manquante', async () => {
    const res = await request(app).post('/api/set-pair').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Le champ "pair" est manquant dans la requête.');
  });

  it('POST /api/set-pair devrait retourner une erreur si le format de la paire est invalide', async () => {
    const res = await request(app).post('/api/set-pair').send({ pair: 'BTC' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Format de paire invalide.');
  });

  it('POST /api/set-pair devrait retourner un succès si la paire est valide', async () => {
    const res = await request(app).post('/api/set-pair').send({ pair: 'ETHUSDT' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Abonnement à la paire mis à jour.');
  });

  it('GET /api/balance/:pair devrait retourner une erreur 404 si la balance est non trouvée', async () => {
    client.account.mockResolvedValue({ data: { balances: [] } });
    const res = await request(app).get('/api/balance/BTCUSDT');
    expect(res.statusCode).toEqual(404);
  });

  it('GET /api/balance/:pair devrait retourner un succès si la balance est trouvée', async () => {
    client.account.mockResolvedValue({ data: { balances: [{ asset: 'BTC', free: '1', locked: '0' }, { asset: 'USDT', free: '1000', locked: '0' }] } });
    const res = await request(app).get('/api/balance/BTCUSDT');
    expect(res.statusCode).toEqual(200);
  });

  it('POST /api/place-order devrait retourner une erreur si les paramètres sont manquants', async () => {
    const res = await request(app).post('/api/place-order').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Missing required order parameters.');
  });

  it('POST /api/place-order devrait retourner une erreur si le prix est manquant pour un ordre LIMIT', async () => {
    const res = await request(app).post('/api/place-order').send({ pair: 'BTCUSDT', side: 'BUY', type: 'LIMIT', quantity: 0.01 });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Missing required order parameters for LIMIT order.');
  });

  it('POST /api/place-order devrait retourner un succès si l\'ordre est valide', async () => {
    const mockCreateOrderRoutes = require('../routes/orderRoutes');
    const mockPlaceTestOrder = jest.fn().mockResolvedValue({});
    mockCreateOrderRoutes.mockReturnValue({
      post: jest.fn((path, handler) => {
        // Find the handler for the /api/place-order route
        if (path === '/') {
          // Call the handler with mock request and response objects
          handler({ body: { side: 'BUY', type: 'MARKET', quantity: 1 } }, { status: jest.fn().mockReturnThis(), json: jest.fn() });
        }
      }),
    });
    const res = await request(app).post('/api/place-order').send({ side: 'BUY', type: 'MARKET', quantity: 1 });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Order placed successfully!');
  });

  it('GET / devrait retourner un succès', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
  });
});
