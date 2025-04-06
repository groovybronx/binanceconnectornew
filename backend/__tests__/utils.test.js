// __tests__/utils.test.js
const { broadcast } = require('../utils');
const { WebSocketServer } = require('ws');

describe('Utils Module', () => {
  let wss;

  beforeEach(() => {
    wss = new WebSocketServer({ port: 8081 });
    jest.useFakeTimers();
  });

  afterEach((done) => {
    wss.close(done);
    jest.useRealTimers();
  });

  it('devrait diffuser des données à tous les clients connectés', async () => {
    const mockClient1 = { send: jest.fn(), readyState: 1 };
    const mockClient2 = { send: jest.fn(), readyState: 1 };
    wss.clients.add(mockClient1);
    wss.clients.add(mockClient2);

    const data = { message: 'test' };
    broadcast(wss, data);
    jest.runAllTimers();

    // Simulate the WebSocket server's behavior
    // by resolving the promises for the mock clients
    mockClient1.readyState = 1;
    mockClient2.readyState = 1;
    mockClient1.send = jest.fn().mockResolvedValue();
    mockClient2.send = jest.fn().mockResolvedValue();

    await Promise.resolve(); // Wait for the microtask queue to be empty

    expect(mockClient1.send).toHaveBeenCalledWith(JSON.stringify(data));
    expect(mockClient2.send).toHaveBeenCalledWith(JSON.stringify(data));
  });
});
