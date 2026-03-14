// ============================================================
// server.js — Express API Gateway
// Institutional Trading Signal Platform
// ============================================================

'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs-extra');
const cron    = require('node-cron');
const config  = require('./config');

// ── Lazy-loaded modules (added as we build each one) ────────
let scanner, telegramBot, backtester;

// ── App init ────────────────────────────────────────────────
const app  = express();
const PORT = config.server.port;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Logger utility ───────────────────────────────────────────
function log(level, msg, data) {
  const ts   = new Date().toISOString();
  const icon = { info: '📘', warn: '⚠️ ', error: '🔴', debug: '🔍' }[level] || '▪️';
  console.log(`[${ts}] ${icon} [${level.toUpperCase()}] ${msg}`,
    data ? JSON.stringify(data, null, 2) : '');
}

// ── Ensure data directories and init files exist ─────────────
async function ensureDataDirs() {
  await fs.ensureDir(config.paths.data);
  await fs.ensureDir(config.paths.cache);

  const initFiles = [
    { path: config.paths.signals,     init: [] },
    { path: config.paths.heatmap,     init: {} },
    { path: config.paths.performance, init: { trades: [], metrics: {} } },
  ];

  for (const f of initFiles) {
    if (!(await fs.pathExists(f.path))) {
      await fs.writeJson(f.path, f.init, { spaces: 2 });
      log('info', `Created init file: ${f.path}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// ── API ROUTES ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

// ── 1. Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    uptime:    Math.round(process.uptime()),
    platform:  'Institutional Trading Signal Platform',
    modules: {
      scanner:    !!scanner,
      backtester: !!backtester,
      telegram:   !!telegramBot,
    },
  });
});

// ── 2. Public config ─────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({
    assets:     config.assets,
    timeframes: config.timeframes,
    indicators: config.indicators,
    signals:    { minConfidence: config.signals.minConfidence },
    scanner:    { intervalSeconds: config.scanner.intervalSeconds },
  });
});

// ── 3. All assets list ────────────────────────────────────────
app.get('/api/assets', (req, res) => {
  const all = [
    ...config.assets.forex.majors.map(a => ({ pair: a, type: 'forex', category: 'major' })),
    ...config.assets.forex.crosses.map(a => ({ pair: a, type: 'forex', category: 'cross' })),
    ...config.assets.crypto.map(a => ({ pair: a, type: 'crypto', category: 'crypto' })),
  ];
  res.json({ success: true, count: all.length, assets: all });
});

// ── 4. Get signals (with filters) ────────────────────────────
app.get('/api/signals', async (req, res) => {
  try {
    const raw = await fs.readJson(config.paths.signals).catch(() => []);
    const { pair, direction, minConf, limit = 50 } = req.query;

    let out = raw;
    if (pair)      out = out.filter(s => s.pair === pair.toUpperCase());
    if (direction) out = out.filter(s => s.direction === direction.toUpperCase());
    if (minConf)   out = out.filter(s => s.confidence >= parseFloat(minConf));

    out = out
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    res.json({ success: true, count: out.length, signals: out });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 5. Get single signal by ID ────────────────────────────────
app.get('/api/signals/:id', async (req, res) => {
  try {
    const raw    = await fs.readJson(config.paths.signals).catch(() => []);
    const signal = raw.find(s => s.id === req.params.id);
    if (!signal) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, signal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 6. Performance metrics ────────────────────────────────────
app.get('/api/performance', async (req, res) => {
  try {
    const perf = await fs.readJson(config.paths.performance).catch(() => ({ trades: [], metrics: {} }));
    res.json({ success: true, ...perf });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 7. Heatmap data ───────────────────────────────────────────
app.get('/api/heatmap', async (req, res) => {
  try {
    const heatmap = await fs.readJson(config.paths.heatmap).catch(() => ({}));
    res.json({ success: true, heatmap });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 8. Manual scan trigger ────────────────────────────────────
app.post('/api/scan', async (req, res) => {
  try {
    if (!scanner) return res.json({ success: false, message: 'Scanner not loaded yet' });
    const results = await scanner.runScan();
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 9. Backtest trigger ───────────────────────────────────────
app.post('/api/backtest', async (req, res) => {
  try {
    if (!backtester) return res.json({ success: false, message: 'Backtester not loaded yet' });
    const result = await backtester.run(req.body);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 10. Catch-all → serve dashboard ──────────────────────────
app.get('*', (req, res) => {
  const dashPath = path.join(__dirname, 'public', 'dashboard.html');
  if (fs.existsSync(dashPath)) {
    res.sendFile(dashPath);
  } else {
    res.json({ message: 'Dashboard not built yet. Add public/dashboard.html in Module 15.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ── STARTUP ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

async function startPlatform() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🏛️  INSTITUTIONAL TRADING SIGNAL PLATFORM  v1.0.0');
  console.log('═══════════════════════════════════════════════════════');

  // Step 1 — Directories
  await ensureDataDirs();
  log('info', 'Data directories ready');

  // Step 2 — Try loading modules (graceful if not built yet)
  const moduleList = [
    { name: 'scanner',     path: './modules/scanner'     },
    { name: 'backtester',  path: './modules/backtester'  },
    { name: 'telegramBot', path: './modules/telegramBot' },
  ];

  for (const m of moduleList) {
    try {
      const mod = require(m.path);
      if (m.name === 'scanner')     scanner     = mod;
      if (m.name === 'backtester')  backtester  = mod;
      if (m.name === 'telegramBot') telegramBot = mod;
      log('info', `Module loaded: ${m.name}`);
    } catch (e) {
      log('warn', `Module pending: ${m.name} (will load when built)`);
    }
  }

  // Step 3 — Start Telegram if enabled
  if (telegramBot && config.telegram.enabled) {
    try {
      await telegramBot.start();
      log('info', 'Telegram bot started');
    } catch (e) {
      log('warn', `Telegram start failed: ${e.message}`);
    }
  }

  // Step 4 — Start Express
  app.listen(PORT, () => {
    console.log('\n');
    log('info', `✅  Server running  →  http://${config.server.host}:${PORT}`);
    log('info', `📊  Dashboard      →  http://${config.server.host}:${PORT}`);
    log('info', `🔌  Health check   →  http://${config.server.host}:${PORT}/api/health`);
    log('info', `📈  Assets         →  http://${config.server.host}:${PORT}/api/assets`);
    log('info', `📡  Signals        →  http://${config.server.host}:${PORT}/api/signals`);
    console.log('\n');
  });

  // Step 5 — Cron scanner (every N seconds)
  if (scanner) {
    const secs = config.scanner.intervalSeconds;
    cron.schedule(`*/${secs} * * * * *`, async () => {
      try {
        log('info', 'Scheduled scan running...');
        await scanner.runScan();
      } catch (err) {
        log('error', `Scan cron error: ${err.message}`);
      }
    });
    log('info', `Scanner cron active: every ${secs}s`);
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

// ── Global error guards ───────────────────────────────────────
process.on('uncaughtException',  err => log('error', `Uncaught Exception: ${err.message}`));
process.on('unhandledRejection', err => log('error', `Unhandled Rejection: ${err?.message || err}`));

// ── Boot ──────────────────────────────────────────────────────
startPlatform().catch(err => {
  log('error', `Fatal startup error: ${err.message}`);
  process.exit(1);
});

module.exports = app;
