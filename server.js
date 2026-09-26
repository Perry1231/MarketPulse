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
  { symbol: "AAPL", name: "Apple Inc.", category: "Technology", type: "stocks", basePrice: 341.0, volatility: 0.4 },
  { symbol: "MSFT", name: "Microsoft Corporation", category: "Technology", type: "stocks", basePrice: 516.0, volatility: 0.5 },
  { symbol: "GOOGL", name: "Alphabet Inc.", category: "Technology", type: "stocks", basePrice: 344.0, volatility: 0.7 },
  { symbol: "AMZN", name: "Amazon.com Inc.", category: "Retail/E-Commerce", type: "stocks", basePrice: 249.5, volatility: 0.6 },
  { symbol: "TSLA", name: "Tesla Inc.", category: "Electric Vehicles", type: "stocks", basePrice: 372.0, volatility: 1.2 },
  { symbol: "META", name: "Meta Platforms, Inc.", category: "Social Media", type: "stocks", basePrice: 751.0, volatility: 0.8 },
  { symbol: "NVDA", name: "NVIDIA Corporation", category: "Semiconductors", type: "stocks", basePrice: 227.0, volatility: 1.1 },
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
  { symbol: "NATGAS", name: "Natural Gas Futures", category: "Oil & Energy", type: "energy", basePrice: 3.9, volatility: 1.0 },
  { symbol: "XAU", name: "Gold Futures", category: "Precious Metals", type: "metals", basePrice: 4286.0, volatility: 0.8 },
  { symbol: "XAG", name: "Silver Futures", category: "Precious Metals", type: "metals", basePrice: 65.2, volatility: 0.9 },
  { symbol: "PLATIN", name: "Platinum Futures", category: "Precious Metals", type: "metals", basePrice: 2280.0, volatility: 0.9 },
  { symbol: "COPPER", name: "Copper Futures", category: "Industrial Metals", type: "metals", basePrice: 5.6, volatility: 0.7 },
  { symbol: "EURUSD", name: "Euro / US Dollar", category: "Forex", type: "forex", basePrice: 1.140, volatility: 0.08 },
  { symbol: "USDJPY", name: "US Dollar / Japanese Yen", category: "Forex", type: "forex", basePrice: 158.2, volatility: 0.12 },
  { symbol: "GBPUSD", name: "British Pound / US Dollar", category: "Forex", type: "forex", basePrice: 1.326, volatility: 0.08 },
  { symbol: "AUDUSD", name: "Australian Dollar / US Dollar", category: "Forex", type: "forex", basePrice: 0.660, volatility: 0.08 },
  { symbol: "USDCAD", name: "US Dollar / Canadian Dollar", category: "Forex", type: "forex", basePrice: 1.370, volatility: 0.08 },
  { symbol: "USDCHF", name: "US Dollar / Swiss Franc", category: "Forex", type: "forex", basePrice: 0.795, volatility: 0.08 },
  { symbol: "EURGBP", name: "Euro / British Pound", category: "Forex", type: "forex", basePrice: 0.860, volatility: 0.06 },
  { symbol: "UAHUSD", name: "Ukrainian Hryvnia / US Dollar", category: "Forex", type: "forex", basePrice: 44.8, volatility: 0.15 },
  { symbol: "BTC", name: "Bitcoin", category: "Cryptocurrency", type: "crypto", basePrice: 84100.0, volatility: 1.2 },
  { symbol: "ETH", name: "Ethereum", category: "Cryptocurrency", type: "crypto", basePrice: 2690.0, volatility: 1.5 },
  { symbol: "SOL", name: "Solana", category: "Cryptocurrency", type: "crypto", basePrice: 116.9, volatility: 1.8 },
  { symbol: "BNB", name: "BNB", category: "Cryptocurrency", type: "crypto", basePrice: 781.8, volatility: 1.4 },
  { symbol: "XRP", name: "XRP", category: "Cryptocurrency", type: "crypto", basePrice: 2.25, volatility: 1.8 },
  { symbol: "ADA", name: "Cardano", category: "Cryptocurrency", type: "crypto", basePrice: 0.50, volatility: 1.8 },
  { symbol: "DOGE", name: "Dogecoin", category: "Cryptocurrency", type: "crypto", basePrice: 0.135, volatility: 2.0 },
  { symbol: "SP500", name: "S&P 500", category: "Indices", type: "indices", basePrice: 7726.0, volatility: 0.3 },
  { symbol: "NASDAQ", name: "Nasdaq Composite", category: "Indices", type: "indices", basePrice: 26990.0, volatility: 0.4 },
  { symbol: "DOW", name: "Dow Jones Industrial Average", category: "Indices", type: "indices", basePrice: 51790.0, volatility: 0.3 },
  { symbol: "RUSSELL", name: "Russell 2000", category: "Indices", type: "indices", basePrice: 2570.0, volatility: 0.5 },
  { symbol: "VIX", name: "CBOE Volatility Index", category: "Indices", type: "indices", basePrice: 16.5, volatility: 1.5 },
  { symbol: "US3M", name: "US 3-Month Treasury", category: "Bonds", type: "bonds", basePrice: 3.90, volatility: 0.10 },
  { symbol: "US5Y", name: "US 5-Year Treasury", category: "Bonds", type: "bonds", basePrice: 4.05, volatility: 0.11 },
  { symbol: "US10Y", name: "US 10-Year Treasury", category: "Bonds", type: "bonds", basePrice: 5.04, volatility: 0.12 },
  { symbol: "US30Y", name: "US 30-Year Treasury", category: "Bonds", type: "bonds", basePrice: 4.70, volatility: 0.13 }
];

const aliases = new Map([
  ["XAUUSD", "XAU"],
  ["XAGUSD", "XAG"],
  ["SP-500", "SP500"],
  ["S&P500", "SP500"],
  ["GSPC", "SP500"],
  ["BTCUSD", "BTC"],
  ["ETHUSD", "ETH"],
  ["SOLUSD", "SOL"],
  ["BNBUSD", "BNB"],
  ["XRPUSD", "XRP"],
  ["ADAUSD", "ADA"],
  ["DOGEUSD", "DOGE"],
  ["NATGAS.F", "NATGAS"],
  ["PL", "PLATIN"],
  ["HG", "COPPER"]
]);

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
    high: price,
    low: price,
    volume: 0,
    source: "pending",
    history: [],
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

function getMarket(symbol) {
  const catalogEntry = findMarket(symbol);
  if (!catalogEntry) return null;
  const state = marketState.get(catalogEntry.symbol);
  if (!state) return null;
  return clone(state);
}

function getMarkets() {
  return marketCatalog.map((market) => clone(marketState.get(market.symbol)));
}

// Return stocks, energy, and metals for the stocks page
function getStocks() {
  return marketCatalog
    .filter((market) => market.type === "stocks" || market.type === "energy" || market.type === "metals")
    .map((market) => clone(marketState.get(market.symbol)));
}

// ── External data: Yahoo Finance ─────────────────────────────────────────────
// One batched "spark" request returns, for every ticker at once: the live
// price, previous close, day high/low, volume AND the full intraday close
// series — which is what makes the charts real instead of simulated.

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const YAHOO_SYMBOLS = {
  AAPL: "AAPL", MSFT: "MSFT", GOOGL: "GOOGL", AMZN: "AMZN", TSLA: "TSLA",
  META: "META", NVDA: "NVDA", NFLX: "NFLX", DIS: "DIS", NKE: "NKE",
  ADBE: "ADBE", QCOM: "QCOM", PYPL: "PYPL", INTC: "INTC", COST: "COST",
  VZ: "VZ", ASML: "ASML", UBER: "UBER",
  EURUSD: "EURUSD=X", USDJPY: "JPY=X", GBPUSD: "GBPUSD=X", UAHUSD: "UAH=X",
  AUDUSD: "AUDUSD=X", USDCAD: "USDCAD=X", USDCHF: "USDCHF=X", EURGBP: "EURGBP=X",
  BRENT: "BZ=F", WTI: "CL=F", NATGAS: "NG=F",
  PLATIN: "PL=F", COPPER: "HG=F",
  SP500: "^GSPC", NASDAQ: "^IXIC", DOW: "^DJI", RUSSELL: "^RUT", VIX: "^VIX",
  US3M: "^IRX", US5Y: "^FVX", US10Y: "^TNX", US30Y: "^TYX"
};

const COINGECKO_IDS = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana", BNB: "binancecoin", XRP: "ripple", ADA: "cardano", DOGE: "dogecoin" };

// Yahoo tickers used to fetch real OHLC history for symbols without a direct
// Yahoo spot mapping (crypto coins, gold/silver spot → futures charts)
const YAHOO_HISTORY_SYMBOLS = { BTC: "BTC-USD", ETH: "ETH-USD", SOL: "SOL-USD", BNB: "BNB-USD", XRP: "XRP-USD", ADA: "ADA-USD", DOGE: "DOGE-USD" };
const YAHOO_EXTRA_HISTORY = { XAU: "GC=F", XAG: "SI=F" };

const HISTORY_RANGES = {
  "1d": { range: "1d", interval: "5m" },
  "5d": { range: "5d", interval: "30m" },
  "1w": { range: "5d", interval: "30m" },
  "1m": { range: "1mo", interval: "1d" },
  "1mo": { range: "1mo", interval: "1d" }
};

async function fetchJson(url, timeoutMs) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

// ── Real history cache ───────────────────────────────────────────────────────
// key: "SYM:range" → { history: [{t, price}], fetchedAt }

const historyCache = new Map();
const HISTORY_TTL_MS = 60 * 1000;
const historyInflight = new Map();

async function fetchYahooHistory(yahooTicker, rangeKey) {
  const cfg = HISTORY_RANGES[rangeKey] || HISTORY_RANGES["1d"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=${cfg.interval}&range=${cfg.range}`;
  const payload = await fetchJson(url, 8000);
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(timestamps) || !Array.isArray(closes)) return null;
  const history = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const price = closes[i];
    if (Number.isFinite(price) && price > 0) {
      history.push({ t: timestamps[i] * 1000, price });
    }
  }
  return history.length ? history : null;
}

async function getRealHistory(symbol, rangeKey) {
  const catalogEntry = findMarket(symbol);
  if (!catalogEntry) return null;
  const range = HISTORY_RANGES[rangeKey] ? rangeKey : "1d";
  const cacheKey = `${catalogEntry.symbol}:${range}`;
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < HISTORY_TTL_MS) {
    return { history: cached.history, cached: true };
  }
  if (historyInflight.has(cacheKey)) {
    return historyInflight.get(cacheKey);
  }
  const job = (async () => {
    const yahooTicker = YAHOO_HISTORY_SYMBOLS[catalogEntry.symbol]
      || YAHOO_EXTRA_HISTORY[catalogEntry.symbol]
      || (catalogEntry.type === "crypto" ? `${catalogEntry.symbol}-USD` : YAHOO_SYMBOLS[catalogEntry.symbol]);
    if (!yahooTicker) return null;
    try {
      const history = await fetchYahooHistory(yahooTicker, range);
      if (history) {
        historyCache.set(cacheKey, { history, fetchedAt: Date.now() });
        return { history, cached: false };
      }
    } catch (_) {
      // network/rate-limit failure — fall through to in-memory history
    }
    const state = marketState.get(catalogEntry.symbol);
    if (state && state.history.length >= 2) {
      return { history: state.history.map((p, i) => ({ t: i, price: p })), cached: false };
    }
    return null;
  })().finally(() => historyInflight.delete(cacheKey));
  historyInflight.set(cacheKey, job);
  return job;
}

// ── Live price refresh ───────────────────────────────────────────────────────

function applyRealPrice(symbol, price, prevClose, high, low, volume, source) {
  const state = marketState.get(symbol);
  if (!state || !Number.isFinite(price) || price <= 0) return;

  state.price = price;
  const ref = (Number.isFinite(prevClose) && prevClose > 0) ? prevClose : state.basePrice;
  state.basePrice = ref;
  state.change = price - ref;
  state.changePercent = ref ? ((price - ref) / ref) * 100 : 0;
  state.high = Number.isFinite(high) && high > 0 ? Math.max(high, price) : Math.max(state.high, price);
  state.low = Number.isFinite(low) && low > 0 ? Math.min(low, price) : (state.low > 0 ? Math.min(state.low, price) : price);
  if (Number.isFinite(volume) && volume > 0) state.volume = volume;
  state.source = source;
  state.isReal = true;
  state.updatedAt = new Date().toISOString();
}

async function fetchCryptoData() {
  const ids = Object.values(COINGECKO_IDS).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  return fetchJson(url, 8000);
}

async function fetchGoldSilverPrice(symbol) {
  const payload = await fetchJson(`https://api.gold-api.com/price/${symbol}`, 6000);
  const value = Number(payload?.price ?? payload?.data?.price);
  return Number.isFinite(value) && value > 0 ? value : null;
}

// Seed each market's in-memory history from the real intraday close series
// returned by the spark endpoint (only when the state has no history yet or
// the fresh series is longer).
function seedHistoryFromCloses(symbol, closes) {
  const state = marketState.get(symbol);
  if (!state || !Array.isArray(closes) || closes.length < 2) return;
  const clean = closes.filter((v) => Number.isFinite(v) && v > 0);
  if (clean.length < 2) return;
  if (state.history.length < clean.length) {
    state.history = clean.slice(-120);
  } else {
    const last = state.history[state.history.length - 1];
    if (clean[clean.length - 1] !== last) {
      state.history.push(clean[clean.length - 1]);
      if (state.history.length > 120) state.history.shift();
    }
  }
}

let isRefreshing = false;
let lastRefreshOk = null;
let lastRefreshAt = null;

async function refreshAllMarkets() {
  if (isRefreshing) return;
  isRefreshing = true;

  const errors = [];

  try {
    // 1. Crypto spot prices (CoinGecko, single batched request)
    try {
      const cryptoData = await fetchCryptoData();
      if (cryptoData) {
        for (const [sym, geckoId] of Object.entries(COINGECKO_IDS)) {
          const coin = cryptoData[geckoId];
          if (!coin || !Number.isFinite(coin.usd)) continue;
          const price = coin.usd;
          const ch24h = coin.usd_24h_change;
          const prevClose = Number.isFinite(ch24h) ? price / (1 + ch24h / 100) : undefined;
          applyRealPrice(sym, price, prevClose, undefined, undefined, undefined, "coingecko");
        }
      }
    } catch (error) {
      errors.push(`coingecko: ${error.message}`);
    }

    // 2. Gold & silver spot (gold-api.com)
    for (const [sym, apiSym] of [["XAU", "XAU"], ["XAG", "XAG"]]) {
      try {
        const spot = await fetchGoldSilverPrice(apiSym);
        if (spot) applyRealPrice(sym, spot, undefined, undefined, undefined, undefined, "gold-api");
      } catch (error) {
        errors.push(`gold-api ${sym}: ${error.message}`);
      }
    }

    // 3. Everything else via batched Yahoo spark requests (chunked — Yahoo
    //    rejects very long symbol lists with HTTP 400)
    const yahooEntries = Object.entries(YAHOO_SYMBOLS);
    const chunkSize = 20;
    for (let i = 0; i < yahooEntries.length; i += chunkSize) {
      const chunk = yahooEntries.slice(i, i + chunkSize);
      const sparkSymbols = chunk.map(([, ticker]) => ticker).join(",");
      try {
        const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(sparkSymbols)}&range=1d&interval=5m`;
        const payload = await fetchJson(url, 12000);
        const results = payload?.spark?.result || [];
        const byTicker = new Map();
        for (const item of results) {
          const resp = Array.isArray(item.response) ? item.response[0] : null;
          if (resp?.meta) byTicker.set(item.symbol, resp);
        }
        for (const [sym, ticker] of chunk) {
          const resp = byTicker.get(ticker);
          if (!resp) continue;
          const meta = resp.meta;
          const price = meta.regularMarketPrice;
          if (!Number.isFinite(price) || price <= 0) continue;
          const prevClose = meta.previousClose ?? meta.chartPreviousClose;
          const closes = resp.indicators?.quote?.[0]?.close;
          applyRealPrice(sym, price, prevClose, meta.regularMarketDayHigh, meta.regularMarketDayLow, meta.regularMarketVolume, "yahoo");
          seedHistoryFromCloses(sym, closes);
        }
      } catch (error) {
        errors.push(`yahoo-spark: ${error.message}`);
      }
    }

    // Crypto/coin intraday history for sparklines: Yahoo spark covers them too.
    // GC=F / SI=F are included as gold/silver fallback spot + real intraday history.
    try {
      const extraTickers = Object.values(YAHOO_EXTRA_HISTORY).join(",");
      const cryptoTickers = Object.values(YAHOO_HISTORY_SYMBOLS).join(",") + (extraTickers ? "," + extraTickers : "");
      const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(cryptoTickers)}&range=1d&interval=5m`;
      const payload = await fetchJson(url, 12000);
      const results = payload?.spark?.result || [];
      const tickerToSym = Object.fromEntries(Object.entries(YAHOO_HISTORY_SYMBOLS).map(([sym, t]) => [t, sym]));
      tickerToSym["GC=F"] = "XAU";
      tickerToSym["SI=F"] = "XAG";
      for (const item of results) {
        const sym = tickerToSym[item.symbol];
        const resp = Array.isArray(item.response) ? item.response[0] : null;
        if (!sym || !resp?.meta) continue;
        seedHistoryFromCloses(sym, resp.indicators?.quote?.[0]?.close);
        // Yahoo crypto spot is fresher than the 60s CoinGecko cache — keep it
        const price = resp.meta.regularMarketPrice;
        if (Number.isFinite(price) && price > 0) {
          const state = marketState.get(sym);
          // XAU/XAG: gold-api spot has priority, Yahoo futures only as fallback
          if (YAHOO_EXTRA_HISTORY[sym] && state && state.isReal) continue;
          applyRealPrice(sym, price, resp.meta.previousClose ?? resp.meta.chartPreviousClose,
            resp.meta.regularMarketDayHigh, resp.meta.regularMarketDayLow, undefined, "yahoo");
        }
      }
    } catch (error) {
      errors.push(`yahoo-spark-crypto: ${error.message}`);
    }

    lastRefreshOk = errors.length === 0;
    lastRefreshAt = new Date().toISOString();
    if (errors.length) console.warn("[refresh] partial failures:", errors.join("; "));
  } finally {
    isRefreshing = false;
  }
}

// Background auto-refresh from real APIs every 30 seconds
setInterval(refreshAllMarkets, 30000);
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
    sendJson(res, 200, {
      status: "ok",
      time: new Date().toISOString(),
      lastRefreshAt,
      lastRefreshOk,
      marketsReal: [...marketState.values()].filter((m) => m.isReal).length,
      marketsTotal: marketState.size
    });
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
        "GET /api/markets/:symbol/history?range=1d|1w|1m",
        "GET /api/stocks"
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
    const range = url.searchParams.get("range") || "1d";
    const history = await getRealHistory(decodeURIComponent(marketMatch[1]), range);
    if (!history) {
      sendError(res, 404, "Market history not found");
      return;
    }
    sendJson(res, 200, {
      symbol: findMarket(decodeURIComponent(marketMatch[1])).symbol,
      range,
      points: history.history.length,
      history: history.history,
      cached: history.cached
    });
    return;
  }

  const marketMatchSimple = url.pathname.match(/^\/api\/(?:market|markets)\/([^/]+)$/);
  if (req.method === "GET" && marketMatchSimple) {
    const market = getMarket(decodeURIComponent(marketMatchSimple[1]));
    if (!market) {
      sendError(res, 404, "Market not found");
      return;
    }
    sendJson(res, 200, { data: market, updatedAt: new Date().toISOString() });
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
