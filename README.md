# 🏛️ Institutional Trading Signal Platform

AI-powered trading signal platform for Forex & Crypto markets.

---

## 🚀 Deploy to Render (Free Tier + GitHub)

### STEP 1 — Download & prepare your project

Make sure your folder looks like this:
```
trading-signal-platform/
├── server.js
├── config.js
├── package.json
├── render.yaml
├── .gitignore
├── .env          ← DO NOT commit this file
├── modules/      ← empty for now
├── public/       ← empty for now
└── data/
    ├── signalHistory.json
    ├── heatmap.json
    └── performance.json
```

---

### STEP 2 — Push to GitHub

Open your terminal inside the project folder and run these
commands ONE BY ONE:

```bash
git init
git add .
git commit -m "Initial commit - Institutional Trading Signal Platform"
```

Now go to https://github.com/new and create a NEW repository:
- Name: trading-signal-platform
- Visibility: Private (recommended)
- Do NOT add README or .gitignore (you already have them)
- Click "Create repository"

GitHub will show you commands. Run these:
```bash
git remote add origin https://github.com/YOUR_USERNAME/trading-signal-platform.git
git branch -M main
git push -u origin main
```

Refresh GitHub — you should see all your files there. ✅

---

### STEP 3 — Create Web Service on Render

1. Go to https://render.com and sign in (or sign up free)
2. Click the purple "New +" button (top right)
3. Select "Web Service"
4. Click "Connect account" → authorize GitHub
5. Find your repo "trading-signal-platform" → click "Connect"

Fill in these settings EXACTLY:
```
Name:           trading-signal-platform
Region:         Oregon (US West)
Branch:         main
Runtime:        Node
Build Command:  npm install && mkdir -p data/cache
Start Command:  node server.js
Plan:           Free
```

Scroll down → Click "Create Web Service"

---

### STEP 4 — Add Environment Variables

After your service is created:
1. Click "Environment" in the left sidebar
2. Click "Add Environment Variable" for each one below:

| Key                  | Value              |
|----------------------|--------------------|
| NODE_ENV             | production         |
| PORT                 | 10000              |
| ALPHA_VANTAGE_KEY    | your_key_here      |
| TWELVE_DATA_KEY      | your_key_here      |
| TELEGRAM_ENABLED     | false              |

Click "Save Changes" — Render will redeploy automatically.

---

### STEP 5 — Get your API Keys (Free)

**Twelve Data** (Forex OHLCV data):
1. Go to https://twelvedata.com/pricing
2. Click "Get started for free"
3. Sign up → go to dashboard → copy your API key
4. Paste into Render environment: TWELVE_DATA_KEY

**Alpha Vantage** (Backup historical data):
1. Go to https://www.alphavantage.co/support/#api-key
2. Fill the form → get instant free key
3. Paste into Render environment: ALPHA_VANTAGE_KEY

---

### STEP 6 — Verify it's live

Render gives you a URL like:
```
https://trading-signal-platform.onrender.com
```

Test it:
```
https://YOUR_APP.onrender.com/api/health   ← should return {"status":"ok"}
https://YOUR_APP.onrender.com/api/assets   ← should return 43 assets
```

✅ You're live!

---

## 📦 After Each Module Is Built

Every time a new module is added, just run:
```bash
git add .
git commit -m "Add Module X - Description"
git push
```
Render auto-deploys in ~2 minutes.

---

## ⚠️ Free Tier Notes

- Server sleeps after 15 minutes of no traffic
- First request after sleep takes ~30 seconds (cold start)
- Data files reset on redeploy (upgrade to Starter $7/mo to persist)
- 750 free hours/month (enough for 1 service running all month)

---

## 🔑 Getting Telegram Bot (Optional, Module 14)

1. Open Telegram → search @BotFather
2. Send: /newbot
3. Follow prompts → copy the token
4. Add to Render env: TELEGRAM_BOT_TOKEN
5. Message @userinfobot to get your chat ID
6. Add to Render env: TELEGRAM_CHAT_ID
7. Set TELEGRAM_ENABLED = true

---

## 📡 API Endpoints

| Endpoint              | Method | Description           |
|-----------------------|--------|-----------------------|
| /api/health           | GET    | Server health check   |
| /api/assets           | GET    | All 43 trading pairs  |
| /api/signals          | GET    | Live signals feed     |
| /api/signals/:id      | GET    | Single signal         |
| /api/performance      | GET    | Backtest performance  |
| /api/heatmap          | GET    | Liquidity heatmap     |
| /api/scan             | POST   | Trigger manual scan   |
| /api/backtest         | POST   | Run backtest          |
