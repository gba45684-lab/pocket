// ============================================================
// config.js — Central Configuration Hub
// Institutional Trading Signal Platform
// ============================================================

require('dotenv').config();

const config = {

  // ── SERVER ──────────────────────────────────────────────
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
  },

  // ── API KEYS ────────────────────────────────────────────
  // Twelve Data is the SINGLE unified source for Forex + Crypto
  api: {
    twelveData: {
      key: process.env.TWELVE_DATA_KEY || 'demo',
      baseUrl: 'https://api.twelvedata.com',
      // Free tier: 8 requests/minute, 800/day
      // Basic tier: 55 req/min — recommended for live scanning
      rateLimitMs: 8000,        // ms between requests (free tier safe)
      maxRetries: 3,
      retryDelayMs: 2000,
      // Twelve Data supports BOTH forex pairs (EUR/USD) and crypto (BTC/USD)
      // Crypto symbols use BTC/USD format — NOT BTC/USDT
      cryptoConvert: true,      // auto-convert BTC/USDT → BTC/USD for API calls
    },
    // Binance kept as FALLBACK for crypto only (public endpoints, no key needed)
    binance: {
      baseUrl: 'https://api.binance.com/api/v3',
      wsUrl: 'wss://stream.binance.com:9443/ws',
      enabled: true,            // used if Twelve Data quota exceeded
    },
  },

  // ── TELEGRAM BOT ────────────────────────────────────────
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || null,
    chatId: process.env.TELEGRAM_CHAT_ID || null,
    channelId: process.env.TELEGRAM_CHANNEL_ID || null,
    enabled: process.env.TELEGRAM_ENABLED === 'true' || false,
    signalMinConfidence: 72,
    cooldownMs: 30000,
  },

  // ── SCANNER ASSETS ──────────────────────────────────────
  assets: {
    forex: {
      majors: [
        'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
        'AUD/USD', 'USD/CAD', 'NZD/USD',
      ],
      crosses: [
        'EUR/GBP', 'EUR/JPY', 'EUR/AUD', 'EUR/CAD',
        'GBP/JPY', 'GBP/AUD', 'GBP/CAD', 'GBP/CHF',
        'AUD/JPY', 'AUD/CAD', 'AUD/NZD', 'AUD/CHF',
        'CAD/JPY', 'CHF/JPY', 'NZD/JPY', 'NZD/CAD',
        'USD/SGD', 'USD/NOK', 'USD/SEK', 'USD/MXN',
      ],
    },
    crypto: [
      'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT',
      'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'DOT/USDT',
      'MATIC/USDT', 'AVAX/USDT', 'LINK/USDT', 'UNI/USDT',
      'ATOM/USDT', 'LTC/USDT', 'BCH/USDT', 'FIL/USDT',
    ],
  },

  // ── TIMEFRAMES ──────────────────────────────────────────
  timeframes: {
    primary:   ['1m', '5m', '15m'],
    secondary: ['1h', '4h'],
    macro:     ['1d'],
    binanceMap: {
      '1m': '1m', '5m': '5m', '15m': '15m',
      '1h': '1h', '4h': '4h',  '1d': '1d',
    },
    twelveDataMap: {
      '1m': '1min', '5m': '5min', '15m': '15min',
      '1h': '1h',   '4h': '4h',   '1d': '1day',
    },
  },

  // ── INDICATOR SETTINGS ──────────────────────────────────
  indicators: {
    ema:  { fast: 8, medium: 21, slow: 50, trend: 200 },
    rsi:  { period: 14, overbought: 70, oversold: 30, extreme_overbought: 80, extreme_oversold: 20 },
    atr:  { period: 14, multiplier: 1.5 },
    bollinger: { period: 20, stdDev: 2 },
    macd: { fast: 12, slow: 26, signal: 9 },
    stochastic: { period: 14, signalPeriod: 3 },
    adx:  { period: 14, trendThreshold: 25 },
    volume: { maLength: 20 },
  },

  // ── SIGNAL ENGINE ───────────────────────────────────────
  signals: {
    minConfidence: 65,
    highConfidence: 80,
    ultraConfidence: 90,
    maxSignalsPerPair: 3,
    expiryMap: {
      '1m': '5m', '5m': '15m', '15m': '1h',
      '1h': '4h', '4h': '1d',
    },
    weights: {
      trendAlignment:    0.20,
      momentum:          0.15,
      liquiditySweep:    0.20,
      orderBlock:        0.15,
      supportResistance: 0.10,
      volumeConfirm:     0.10,
      aiProbability:     0.10,
    },
  },

  // ── LIQUIDITY ENGINE ────────────────────────────────────
  liquidity: {
    sweepLookback: 20,
    sweepThreshold: 0.0015,
    heatmapLevels: 10,
    institutionalSize: 1000000,
  },

  // ── SUPPORT & RESISTANCE ────────────────────────────────
  supportResistance: {
    lookback: 100,
    minTouches: 2,
    zoneWidth: 0.002,
    maxZones: 8,
  },

  // ── ORDER BLOCKS ────────────────────────────────────────
  orderBlocks: {
    lookback: 50,
    minImbalanceRatio: 1.5,
    validityCandles: 30,
  },

  // ── AI MODEL ────────────────────────────────────────────
  ai: {
    trainSplit: 0.8,
    features: 24,
    minTrainSamples: 1000,
    modelPath: './data/model.json',
    historyPath: './data/historicalData.json',
    signalHistoryPath: './data/signalHistory.json',
    retrain: { enabled: true, intervalHours: 24 },
  },

  // ── BACKTESTER ──────────────────────────────────────────
  backtester: {
    initialBalance: 10000,
    riskPerTrade: 0.02,
    maxDrawdown: 0.15,
    commission: 0.0001,
    slippage: 0.0001,
  },

  // ── SCANNER ─────────────────────────────────────────────
  scanner: {
    intervalSeconds: 60,
    parallelRequests: 5,
    cacheExpiryMs: 55000,
  },

  // ── DATA PATHS ──────────────────────────────────────────
  paths: {
    data: './data',
    historical: './data/historicalData.json',
    signals: './data/signalHistory.json',
    model: './data/model.json',
    heatmap: './data/heatmap.json',
    performance: './data/performance.json',
    cache: './data/cache',
  },

  // ── LOGGING ─────────────────────────────────────────────
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    signals: true,
    scanner: false,
    indicators: false,
  },
};

module.exports = config;
