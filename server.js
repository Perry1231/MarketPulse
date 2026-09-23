"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const MAX_BODY_SIZE = 64 * 1024;

const marketCatalog = [
  { symbol: "AAPL", name: "Apple Inc.", category: "Technology", type: "stocks", basePrice: 337.6, volatility: 0.4 },
  { symbol: "MSFT", name: "Microsoft Corporation", category: "Technology", type: "stocks", basePrice: 499.0, volatility: 0.5 },
  { symbol: "GOOGL", name: "Alphabet Inc.", category: "Technology", type: "stocks", basePrice: 341.7, volatility: 0.7 },
  { symbol: "AMZN", name: "Amazon.com Inc.", category: "Retail/E-Commerce", type: "stocks", basePrice: 249.0, volatility: 0.6 },
  { symbol: "TSLA", name: "Tesla Inc.", category: "Electric Vehicles", type: "stocks", basePrice: 381.5, volatility: 1.2 },
  { symbol: "META", name: "Meta Platforms, Inc.", category: "Social Media", type: "stocks", basePrice: 746.5, volatility: 0.8 },
  { symbol: "NVDA", name: "NVIDIA Corporation", category: "Semiconductors", type: "stocks", basePrice: 226.9, volatility: 1.1 },
  { symbol: "NFLX", name: "Netflix, Inc.", category: "Media Streaming", type: "stocks", basePrice: 71.8, volatility: 0.9 },
  { symbol: "DIS", name: "The Walt Disney Company", category: "Media Entertainment", type: "stocks", basePrice: 103.2, volatility: 0.6 },
  { symbol: "NKE", name: "Nike, Inc.", category: "Apparel", type: "stocks", basePrice: 36.0, volatility: 0.4 },
  { symbol: "ADBE", name: "Adobe Inc.", category: "Software", type: "stocks", basePrice: 239.0, volatility: 0.9 },
  { symbol: "QCOM", name: "Qualcomm Incorporated", category: "Semiconductors", type: "stocks", basePrice: 194.8, volatility: 0.6 },
  { symbol: "PYPL", name: "PayPal Holdings, Inc.", category: "Fintech", type: "stocks", basePrice: 51.9, volatility: 0.5 },
  { symbol: "INTC", name: "Intel Corporation", category: "Semiconductors", type: "stocks", basePrice: 120.3, volatility: 0.4 },
  { symbol: "COST", name: "Costco Wholesale", category: "Retail", type: "stocks", basePrice: 897.2, volatility: 0.6 },
  { symbol: "VZ", name: "Verizon Communications", category: "Telecommunications", type: "stocks", basePrice: 46.4, volatility: 0.2 },
  { symbol: "ASML", name: "ASML Holding", category: "Semiconductors", type: "stocks", basePrice: 1711.0, volatility: 1.0 },
  { symbol: "UBER", name: "Uber Technologies", category: "Transportation", type: "stocks", basePrice: 69.1, volatility: 0.7 },
  { symbol: "BRENT", name: "Brent Crude Oil", category: "Oil & Energy", type: "energy", basePrice: 97.1, volatility: 0.3 },
  { symbol: "WTI", name: "WTI Crude Oil", category: "Oil & Energy", type: "energy", basePrice: 91.8, volatility: 0.3 },
  { symbol: "XAU", name: "Gold Futures", category: "Precious Metals", type: "metals", basePrice: 4326.0, volatility: 0.8 },
  { symbol: "XAG", name: "Silver Futures", category: "Precious Metals", type: "metals", basePrice: 65.2, volatility: 0.9 },
  { symbol: "EURUSD", name: "Euro / US Dollar", category: "Forex", type: "forex", basePrice: 1.140, volatility: 0.08 },
  { symbol: "USDJPY", name: "US Dollar / Japanese Yen", category: "Forex", type: "forex", basePrice: 158.2, volatility: 0.12 },
  { symbol: "GBPUSD", name: "British Pound / US Dollar", category: "Forex", type: "forex", basePrice: 1.326, volatility: 0.08 },
  { symbol: "UAHUSD", name: "Ukrainian Hryvnia / US Dollar", category: "Forex", type: "forex", basePrice: 44.8, volatility: 0.15 },
  { symbol: "BTC", name: "Bitcoin", category: "Cryptocurrency", type: "crypto", basePrice: 85850.0, volatility: 1.2 },
  { symbol: "ETH", name: "Ethereum", category: "Cryptocurrency", type: "crypto", basePrice: 2720.0, volatility: 1.5 },
  { symbol: "SOL", name: "Solana", category: "Cryptocurrency", type: "crypto", basePrice: 116.9, volatility: 1.8 },
  { symbol: "BNB", name: "BNB", category: "Cryptocurrency", type: "crypto", basePrice: 781.8, volatility: 1.4 },
  { symbol: "SP500", name: "S&P 500", category: "Indices", type: "indices", basePrice: 7726.0, volatility: 0.3 },
  { symbol: "NASDAQ", name: "Nasdaq Composite", category: "Indices", type: "indices", basePrice: 26990.0, volatility: 0.4 },
  { symbol: "DOW", name: "Dow Jones Industrial Average", category: "Indices", type: "indices", basePrice: 51790.0, volatility: 0.3 },
  { symbol: "US10Y", name: "US 10-Year Treasury", category: "Bonds", type: "bonds", basePrice: 5.04, volatility: 0.12 }
];

const aliases = new Map([
  ["XAUUSD", "XAU"],
  ["XAGUSD", "XAG"],
  ["EURUSD", "EURUSD"],
  ["USDJPY", "USDJPY"],
  ["GBPUSD", "GBPUSD"],
  ["SP-500", "SP500"],
  ["S&P500", "SP500"],
  ["BTCUSD", "BTC"],
  ["ETHUSD", "ETH"],
  ["SOLUSD", "SOL"],
  ["BNBUSD", "BNB"]
]);

const contactMessages = [];
const marketState = new Map(marketCatalog.map((market) => [market.symbol, createMarket(market)]));

function createMarket(market) {
  const price = market.basePrice;
  return {
    symbol: market.symbol,
    name: market.name,
    category: market.category,
    type: market.type,
    basePrice: market.basePrice,
    volatility: market.volatility,
    price,
    change: 0,
    changePercent: 0,
    high: price * 1.005,
    low: price * 0.995,
    volume: Math.floor(Math.random() * 5000000) + 1000000,
    history: [price],
    isReal: false,
    updatedAt: new Date().toISOString()
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSymbol(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "").replace("/", "");
}

function findMarket(symbol) {
  const normalized = normalizeSymbol(symbol);
  const direct = marketCatalog.find((market) => market.symbol === normalized);
  if (direct) return direct;
  const alias = aliases.get(normalized);
  if (alias) return marketCatalog.find((market) => market.symbol === alias);
  return marketCatalog.find((market) => market.symbol.startsWith(normalized) || normalized.startsWith(market.symbol)) || null;
}

// Tick simulation used ONLY when real API data is not yet available
function tickMarket(market) {
  if (market.isReal) return;
  const previous = market.price;
  const tick = (Math.random() - 0.5) * previous * (market.volatility / 100);
  const price = Math.max(0.01, previous + tick);
  const change = price - market.basePrice;
  market.price = price;
  market.change = change;
  market.changePercent = market.basePrice ? (change / market.basePrice) * 100 : 0;
  market.high = Math.max(market.high, price);
  market.low = Math.min(market.low, price);
  market.volume += Math.floor(Math.random() * 10000);
  market.history.push(price);
  if (market.history.length > 60) market.history.shift();
  market.updatedAt = new Date().toISOString();
}

function getMarket(symbol) {
  const catalogEntry = findMarket(symbol);
  if (!catalogEntry) return null;
  const state = marketState.get(catalogEntry.symbol);
  if (!state) return null;
  if (!state.isReal) tickMarket(state);
  return clone(state);
}

function getMarkets() {
  marketCatalog.forEach((m) => {
    const state = marketState.get(m.symbol);
    if (state && !state.isReal) tickMarket(state);
  });
  return marketCatalog.map((market) => clone(marketState.get(market.symbol)));
}

// Return stocks, energy, and metals for the stocks page
function getStocks() {
  return marketCatalog
    .filter((market) => market.type === "stocks" || market.type === "energy" || market.type === "metals")
    .map((market) => {
      const state = marketState.get(market.symbol);
      if (state && !state.isReal) tickMarket(state);
      return clone(state);
    });
}

function getHistory(symbol, points = 60) {
  const catalogEntry = findMarket(symbol);
  if (!catalogEntry) return null;
  const state = marketState.get(catalogEntry.symbol);
  if (!state) return null;
  const normalizedPoints = Math.min(500, Math.max(2, Number(points) || 60));
  const history = state.history.slice(-normalizedPoints);
  while (history.length < normalizedPoints) {
    const previous = history.length ? history[history.length - 1] : state.price;
    const next = Math.max(0.01, previous * (1 + (Math.random() - 0.5) * (state.volatility / 100)));
    history.push(next);
  }
  return {
    symbol: state.symbol,
    name: state.name,
    points: normalizedPoints,
    history
  };
}

// ── External data fetching ───────────────────────────────────────────────────

const COINGECKO_IDS = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana", BNB: "binancecoin" };

const YAHOO_SYMBOLS = {
  AAPL: "AAPL", MSFT: "MSFT", GOOGL: "GOOGL", AMZN: "AMZN", TSLA: "TSLA",
  META: "META", NVDA: "NVDA", NFLX: "NFLX", DIS: "DIS", NKE: "NKE",
  ADBE: "ADBE", QCOM: "QCOM", PYPL: "PYPL", INTC: "INTC", COST: "COST",
  VZ: "VZ", ASML: "ASML", UBER: "UBER",
  EURUSD: "EURUSD=X", USDJPY: "JPY=X", GBPUSD: "GBPUSD=X", UAHUSD: "UAH=X",
  BRENT: "BZ=F", WTI: "CL=F",
  XAU: "GC=F", XAG: "SI=F",
  SP500: "^GSPC", NASDAQ: "^IXIC", DOW: "^DJI",
  US10Y: "^TNX"
};

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchYahooPrice(yahooTicker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=1m&range=1d`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) return null;
  const payload = await response.json();
  const meta = payload?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  const price = meta.regularMarketPrice;
  const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPreviousClose;
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    price,
    prevClose: (Number.isFinite(prevClose) && prevClose > 0) ? prevClose : price,
    high: meta.regularMarketDayHigh || meta.dayHigh,
    low: meta.regularMarketDayLow || meta.dayLow,
    volume: meta.regularMarketVolume || meta.volume
  };
}

async function fetchCryptoData() {
  const ids = Object.values(COINGECKO_IDS).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) return null;
  return response.json();
}

async function fetchGoldSilverPrice(symbol) {
  const response = await fetch(`https://api.gold-api.com/price/${symbol}`, {
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) return null;
  const payload = await response.json();
  const value = Number(payload?.price ?? payload?.data?.price);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function applyRealPrice(symbol, price, prevClose, high, low, volume) {
  const state = marketState.get(symbol);
  if (!state || !Number.isFinite(price) || price <= 0) return;

  state.price = price;
  const ref = (Number.isFinite(prevClose) && prevClose > 0) ? prevClose : state.basePrice;
  state.basePrice = ref;
  state.change = price - ref;
  state.changePercent = ref ? ((price - ref) / ref) * 100 : 0;
  state.high = Number.isFinite(high) && high > 0 ? high : Math.max(state.high, price);
  state.low = Number.isFinite(low) && low > 0 ? low : Math.min(state.low, price);
  if (Number.isFinite(volume) && volume > 0) state.volume = volume;
  
  state.history.push(price);
  if (state.history.length > 60) state.history.shift();
  state.isReal = true;
  state.updatedAt = new Date().toISOString();
}

let isRefreshing = false;

async function refreshAllMarkets() {
  if (isRefreshing) return;
  isRefreshing = true;

  try {
    // 1. Fetch Crypto (CoinGecko)
    try {
      const cryptoData = await fetchCryptoData();
      if (cryptoData) {
        for (const [sym, geckoId] of Object.entries(COINGECKO_IDS)) {
          const coin = cryptoData[geckoId];
          if (!coin || !Number.isFinite(coin.usd)) continue;
          const price = coin.usd;
          const ch24h = coin.usd_24h_change;
          const prevClose = Number.isFinite(ch24h) ? price / (1 + ch24h / 100) : price;
          applyRealPrice(sym, price, prevClose);
        }
      }
    } catch (_) {}

    // 2. Fetch Metals (Gold-API)
    for (const sym of ["XAU", "XAG"]) {
      try {
        const spot = await fetchGoldSilverPrice(sym);
        if (spot) {
          applyRealPrice(sym, spot, null);
        }
      } catch (_) {}
    }

    // 3. Fetch Yahoo Finance symbols in small concurrent chunks (6 at a time)
    const yahooSymbolsList = Object.keys(YAHOO_SYMBOLS).filter(
      (s) => !COINGECKO_IDS[s]
    );

    const chunkSize = 6;
    for (let i = 0; i < yahooSymbolsList.length; i += chunkSize) {
      const chunk = yahooSymbolsList.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (sym) => {
          try {
            const data = await fetchYahooPrice(YAHOO_SYMBOLS[sym]);
            if (data) {
              applyRealPrice(sym, data.price, data.prevClose, data.high, data.low, data.volume);
            }
          } catch (_) {}
        })
      );
    }
  } finally {
    isRefreshing = false;
  }
}

// Background auto-refresh every 15 seconds
setInterval(refreshAllMarkets, 15000);
// Initial fetch on boot
refreshAllMarkets().catch(() => {});

// ── HTTP API & Static Server ─────────────────────────────────────────────────

function setCommonHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, payload) {
  setCommonHeaders(res);
  const body = JSON.stringify(payload);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.statusCode = status;
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error("Request body is too large"));
        req.resume();
        return;
      }
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function parseContactBody(body) {
  let data;
  try {
    data = JSON.parse(body || "{}");
  } catch {
    throw new Error("Invalid JSON body");
  }
  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim();
  const message = String(data.message || "").trim();
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    throw new Error("Name, valid email and message are required");
  }
  return { name, email, message };
}

async function serveStatic(req, res, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendError(res, 400, "Invalid path");
    return;
  }
  if (decodedPath === "/") decodedPath = "/index.html";
  const filePath = path.resolve(ROOT, `.${decodedPath}`);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    sendError(res, 403, "Forbidden");
    return;
  }
  try {
    const file = await fs.promises.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml"
    };
    setCommonHeaders(res);
    res.setHeader("Content-Type", contentTypes[extension] || "application/octet-stream");
    res.statusCode = 200;
    res.end(file);
  } catch (error) {
    if (error.code === "ENOENT") sendError(res, 404, "Not found");
    else sendError(res, 500, "Server error");
  }
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    setCommonHeaders(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { status: "ok", time: new Date().toISOString() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api") {
    sendJson(res, 200, {
      name: "Market Pulse API",
      endpoints: [
        "GET /api/health",
        "GET /api/markets",
        "GET /api/markets/:symbol",
        "GET /api/market/:symbol",
        "GET /api/markets/:symbol/history?points=60",
        "GET /api/stocks",
        "POST /api/contact"
      ]
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/markets") {
    sendJson(res, 200, { data: getMarkets(), updatedAt: new Date().toISOString() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/stocks") {
    sendJson(res, 200, { data: getStocks(), updatedAt: new Date().toISOString() });
    return;
  }

  const groupMatch = url.pathname.match(/^\/api\/(stocks|forex|crypto|indices|bonds|energy|metals)$/);
  if (req.method === "GET" && groupMatch) {
    const type = groupMatch[1];
    const data = marketCatalog
      .filter((market) => market.type === type)
      .map((market) => clone(marketState.get(market.symbol)));
    sendJson(res, 200, { data, type, updatedAt: new Date().toISOString() });
    return;
  }

  const marketMatch = url.pathname.match(/^\/api\/(?:market|markets)\/([^/]+)\/history$/);
  if (req.method === "GET" && marketMatch) {
    const history = getHistory(marketMatch[1], Number(url.searchParams.get("points") || 60));
    if (!history) {
      sendError(res, 404, "Market not found");
      return;
    }
    sendJson(res, 200, history);
    return;
  }

  const marketMatchSimple = url.pathname.match(/^\/api\/(?:market|markets)\/([^/]+)$/);
  if (req.method === "GET" && marketMatchSimple) {
    const market = getMarket(marketMatchSimple[1]);
    if (!market) {
      sendError(res, 404, "Market not found");
      return;
    }
    sendJson(res, 200, { data: market, updatedAt: new Date().toISOString() });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/contact") {
    try {
      const data = parseContactBody(await readRequestBody(req));
      const message = { id: Date.now(), ...data, createdAt: new Date().toISOString() };
      contactMessages.push(message);
      sendJson(res, 201, { ok: true, message: "Message received", data: message });
    } catch (error) {
      sendError(res, 400, error.message);
    }
    return;
  }

  sendError(res, 404, "API endpoint not found");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (url.pathname.startsWith("/api/")) await handleApi(req, res, url);
    else await serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) sendError(res, 500, "Internal server error");
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Market Pulse API running at http://${HOST}:${PORT}`);
  console.log(`Open http://${HOST}:${PORT}`);
});