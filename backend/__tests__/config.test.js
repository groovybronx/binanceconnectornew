// __tests__/config.test.js
const config = require('../config');

describe('Configuration Module', () => {
  it('devrait avoir une propriété PORT', () => {
    expect(config).toHaveProperty('PORT');
  });

  it('devrait avoir une propriété BINANCE_API_KEY', () => {
    expect(config).toHaveProperty('BINANCE_API_KEY');
  });

  it('devrait avoir une propriété BINANCE_API_SECRET', () => {
    expect(config).toHaveProperty('BINANCE_API_SECRET');
  });

  it('devrait avoir une propriété BINANCE_TRADING_PAIR', () => {
    expect(config).toHaveProperty('BINANCE_TRADING_PAIR');
  });

  it('devrait avoir une propriété BINANCE_BASE_URL', () => {
    expect(config).toHaveProperty('BINANCE_BASE_URL');
  });

  it('PORT devrait être un nombre', () => {
    expect(typeof config.PORT).toBe('number');
  });

  it('BINANCE_TRADING_PAIR devrait être une chaîne de caractères', () => {
    expect(typeof config.BINANCE_TRADING_PAIR).toBe('string');
  });

  it('BINANCE_BASE_URL devrait être une chaîne de caractères', () => {
    expect(typeof config.BINANCE_BASE_URL).toBe('string');
  });
});
