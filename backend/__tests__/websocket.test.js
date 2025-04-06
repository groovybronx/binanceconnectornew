// __tests__/websocket.test.js
const { setupWebSocketServer, subscribeToDepth, disconnectDepthStream } = require('../websocket');
const http = require('http');
const { WebSocket } = require('ws');
const { WebsocketStream } = require('@binance/connector');

jest.mock('@binance/connector'); // Mock the Binance connector

describe('WebSocket Module', () => {
  let server;
  let wss;
  const mockBroadcast = jest.fn();
  const mockGetCurrentTradingPair = jest.fn(() => 'BTCUSDT');
  let mockSubscribe;
  let mockUnsubscribe;
  let mockDisconnect;

  beforeEach(() => {
    server = http.createServer();
    wss = setupWebSocketServer(server, mockBroadcast, subscribeToDepth, mockGetCurrentTradingPair);
    server.listen();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    mockSubscribe = jest.fn();
    mockUnsubscribe = jest.fn();
    mockDisconnect = jest.fn();
    WebsocketStream.mockImplementation(() => ({
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      disconnect: mockDisconnect,
    }));
  });

  afterEach((done) => {
    wss.close(() => {
      server.close(done);
    });
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('devrait configurer un serveur WebSocket', () => {
    expect(wss).toBeDefined();
  });

  it('devrait gérer une nouvelle connexion', (done) => {
    const ws = new WebSocket(`ws://localhost:${server.address().port}`);

    ws.on('open', () => {
      expect(mockGetCurrentTradingPair).toHaveBeenCalled();
      ws.close();
      done();
    });
  });

  it('devrait envoyer la configuration initiale à la connexion', (done) => {
    const ws = new WebSocket(`ws://localhost:${server.address().port}`);

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      expect(message.type).toBe('config');
      expect(message.pair).toBe('BTCUSDT');
      ws.close();
      done();
    });
  });

  it('devrait appeler unsubscribe et disconnect lors de disconnectDepthStream', () => {
    subscribeToDepth('BTCUSDT', mockBroadcast);
    disconnectDepthStream();
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
