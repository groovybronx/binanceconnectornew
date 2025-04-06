// __tests__/binance.test.js
const { setupBinanceClient, subscribeToPair, getCurrentTradingPair, disconnectTickerService } = require('../binance');
const { Spot } = require('@binance/spot');
const TickerService = require('../services/CryptoTickerService');
const { subscribeToDepth } = require('../websocket');

jest.mock('../websocket');
jest.mock('../services/CryptoTickerService');

describe('Binance Module', () => {
  const mockApiKey = 'testApiKey';
  const mockApiSecret = 'testApiSecret';
  const mockBaseUrl = 'https://testnet.binance.vision';
  const mockBroadcast = jest.fn();
  let mockDisconnect;
  let mockTickerServiceInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDisconnect = jest.fn();
    mockTickerServiceInstance = {
      disconnect: mockDisconnect,
    };
    // Mock the TickerService constructor to return our mock instance
    TickerService.mockImplementation(() => mockTickerServiceInstance);
  });

  it('devrait configurer un client Binance', () => {
    const client = setupBinanceClient(mockApiKey, mockApiSecret, mockBaseUrl);
    expect(client).toBeInstanceOf(Spot);
  });

  it('devrait appeler disconnect sur tickerService lors de subscribeToPair', () => {
    subscribeToPair('BTCUSDT', mockBroadcast, TickerService);
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('devrait appeler subscribeToDepth lors de subscribeToPair', () => {
    subscribeToPair('BTCUSDT', mockBroadcast, TickerService);
    expect(subscribeToDepth).toHaveBeenCalled();
  });

  it('devrait retourner la paire actuelle avec getCurrentTradingPair', () => {
    subscribeToPair('BTCUSDT', mockBroadcast, TickerService);
    expect(getCurrentTradingPair()).toBe('BTCUSDT');
  });

    it('devrait appeler disconnect sur tickerService lors de la déconnexion', () => {
        disconnectTickerService();
        expect(mockDisconnect).toHaveBeenCalled();
    });
});
