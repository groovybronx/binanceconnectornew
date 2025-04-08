const { expect } = require('chai');
const sinon = require('sinon');
const express = require('express');
const request = require('supertest');
const dotenv = require('dotenv');
dotenv.config();

// Mock the WebsocketAPI class and its methods
const mockClient = {
  testNewOrder: sinon.stub(),
  disconnect: sinon.stub(),
};

const mockWebsocketAPI = {
  connect: sinon.stub().callsFake(function() {
    const openCallback = MockWebsocketAPIConstructor.getCall(0).args[2].callbacks.open;
    openCallback(mockClient);
  }),
};

// Mock the WebsocketAPI constructor
const MockWebsocketAPIConstructor = sinon.stub().returns(mockWebsocketAPI);

// Replace the actual WebsocketAPI with the mock
const proxyquire = require('proxyquire').noCallThru();
const createOrderRoutes = proxyquire('../routes/orderRoutes', {
  '@binance/connector': { WebsocketAPI: MockWebsocketAPIConstructor },
});

describe('Order Routes', () => {
  let app;
  let messages;
  let clientInstance;
  let isConnected;

  beforeEach(async () => {
    // Reset stubs before each test
    sinon.reset();
    // Create a new express app for each test
    app = express();
    app.use(express.json());
    const result = await createOrderRoutes();
    messages = result.messages;
    clientInstance = result.clientInstance;
    isConnected = result.isConnected;
  });

  afterEach(() => {
    // Restore the original console.log after each test
    sinon.restore();
    if (clientInstance && clientInstance.disconnect) {
      clientInstance.disconnect();
    }
  });

  it('should connect to Websocket server and call testNewOrder', async () => {
    // Wait for the connection to be established
    await new Promise((resolve) => {
      const checkConnection = () => {
        if (isConnected) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });

    // Assertions
    expect(MockWebsocketAPIConstructor.calledOnce).to.be.true;
    expect(mockWebsocketAPI.connect.calledOnce).to.be.true;
    expect(mockClient.testNewOrder.calledOnce).to.be.true;
    expect(mockClient.testNewOrder.calledWith({
      symbol: 'BTCUSDT',
      side: 'BUY',
      orderType: 'LIMIT',
      price: 1,
      quantity: 1,
      timeInForce: 'GTC'
    })).to.be.true;
  });

  it('should log messages received from the Websocket server', async () => {
    // Wait for the connection to be established
    await new Promise((resolve) => {
      const checkConnection = () => {
        if (isConnected) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });

    // Simulate receiving a message
    const message = { event: 'order', status: 'FILLED' };
    const callback = MockWebsocketAPIConstructor.getCall(0).args[2].callbacks.message;
    callback(message);

    // Assertions
    expect(messages.length).to.equal(1);
    expect(messages[0]).to.deep.equal(message);
  });

  it('should log connection and disconnection events', async () => {
    const consoleDebugStub = sinon.stub(console, 'debug');
    const consoleInfoStub = sinon.stub(console, 'info');

    // Wait for the connection to be established
    await new Promise((resolve) => {
      const checkConnection = () => {
        if (isConnected) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });

    // Simulate connection
    const openCallback = MockWebsocketAPIConstructor.getCall(0).args[2].callbacks.open;
    openCallback(mockClient);

    // Simulate disconnection
    const closeCallback = MockWebsocketAPIConstructor.getCall(0).args[2].callbacks.close;
    closeCallback();

    // Assertions
    expect(consoleDebugStub.calledWith('Connected with Websocket server')).to.be.true;
    expect(consoleDebugStub.calledWith('Disconnected with Websocket server')).to.be.true;
    consoleDebugStub.restore();
    consoleInfoStub.restore();
  });
});
