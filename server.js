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
  { symbol: "AAPL", name: "Apple Inc.", category: "Technology", type: "stocks", basePrice: 340.08, volatility: 0.4 },
  { symbol: "MSFT", name: "Microsoft Corporation", category: "Technology", type: "stocks", basePrice: 378.2, volatility: 0.5 },
  { symbol: "GOOGL", name: "Alphabet Inc.", category: "Technology", type: "stocks", basePrice: 138.65, volatility: 0.7 },
  { symbol: "AMZN", name: "Amazon.com Inc.", category: "Retail/E-Commerce", type: "stocks", basePrice: 165, volatility: 0.6 },
  { symbol: "TSLA", name: "Tesla Inc.", category: "Electric Vehicles", type: "stocks", basePrice: 217.3, volatility: 1.2 },
  { symbol: "META", name: "Meta Platforms, Inc.", category: "Social Media", type: "stocks", basePrice: 421.45, volatility: 0.8 },
  { symbol: "NVDA", name: "NVIDIA Corporation", category: "Semiconductors", type: "stocks", basePrice: 118.2, volatility: 1.1 },
  { symbol: "NFLX", name: "Netflix, Inc.", category: "Media Streaming", type: "stocks", basePrice: 702.4, volatility: 0.9 },
  { symbol: "DIS", name: "The Walt Disney Company", category: "Media Entertainment", type: "stocks", basePrice: 112.3, volatility: 0.6 },
  { symbol: "NKE", name: "Nike, Inc.", category: "Apparel", type: "stocks", basePrice: 79.5, volatility: 0.4 },
  { symbol: "ADBE", name: "Adobe Inc.", category: "Software", type: "stocks", basePrice: 442.75, volatility: 0.9 },
  { symbol: "QCOM", name: "Qualcomm Incorporated", category: "Semiconductors", type: "stocks", basePrice: 168.1, volatility: 0.6 },
  { symbol: "PYPL", name: "PayPal Holdings, Inc.", category: "Fintech", type: "stocks", basePrice: 68.2, volatility: 0.5 },
  { symbol: "INTC", name: "Intel Corporation", category: "Semiconductors", type: "stocks", basePrice: 24.7, volatility: 0.4 },
  { symbol: "COST", name: "Costco Wholesale", category: "Retail", type: "stocks", basePrice: 930.2, volatility: 0.6 },
  { symbol: "VZ", name: "Verizon Communications", category: "Telecommunications", type: "stocks", basePrice: 40.1, volatility: 0.2 },
  { symbol: "ASML", name: "ASML Holding", category: "Semiconductors", type: "stocks", basePrice: 895.5, volatility: 1, },
  { symbol: "UBER", name: "Uber Technologies", category: "Transportation", type: "stocks", basePrice: 76.35, volatility: 0.7 },
  { symbol: "BRENT", name: "Brent Crude Oil", category: "Oil & Energy", type: "energy", basePrice: 79.8, volatility: 0.3 },
  { symbol: "WTI", name: "WTI Crude Oil", category: "Oil & Energy", type: "energy", basePrice: 76.45, volatility: 0.3 },
  { symbol: "XAU", name: "Gold Futures", category: "Precious Metals", type: "metals", basePrice: 3335, volatility: 2.5 },
  { symbol: "XAG", name: "Silver Futures", category: "Precious Metals", type: "metals", basePrice: 31.2, volatility: 0.5 },
  { symbol: "EURUSD", name: "Euro / US Dollar", category: "Forex", type: "forex", basePrice: 1.08, volatility: 0.08 },
  { symbol: "USDJPY", name: "US Dollar / Japanese Yen", category: "Forex", type: "forex", basePrice: 155.2, volatility: 0.12 },
  { symbol: "GBPUSD", name: "British Pound / US Dollar", category: "Forex", type: "forex", basePrice: 1.27, volatility: 0.08 },
  { symbol: "UAHUSD", name: "Ukrainian Hryvnia / US Dollar", category: "Forex", type: "forex", basePrice: 0.025, volatility: 0.15 },
  { symbol: "BTC", name: "Bitcoin", category: "Cryptocurrency", type: "crypto", basePrice: 65000, volatility: 1.8 },
  { symbol: "ETH", name: "Ethereum", category: "Cryptocurrency", type: "crypto", basePrice: 3200, volatility: 2.2 },
  { symbol: "SOL", name: "Solana", category: "Cryptocurrency", type: "crypto", basePrice: 145, volatility: 2.8 },
  { symbol: "BNB", name: "BNB", category: "Cryptocurrency", type: "crypto", basePrice: 590, volatility: 2.0 },
  { symbol: "SP500", name: "S&P 500", category: "Indices", type: "indices", basePrice: 5300, volatility: 0.35 },
  { symbol: "NASDAQ", name: "Nasdaq Composite", category: "Indices", type: "indices", basePrice: 17500, volatility: 0.4 },
  { symbol: "DOW", name: "Dow Jones Industrial Average", category: "Indices", type: "indices", basePrice: 39000, volatility: 0.3 },
  { symbol: "US10Y", name: "US 10-Year Treasury", category: "Bonds", type: "bonds", basePrice: 4.35, volatility: 0.12 }
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
  const price = Math.max(0.01, market.basePrice * (1 + (Math.random() - 0.5) * (market.volatility / 100)));
  const change = price - market.basePrice;
  return {
    symbol: market.symbol,
    name: market.name,
    category: market.category,
    type: market.type,
    basePrice: market.basePrice,
    volatility: market.volatility,
    price,
    change,
    changePercent: market.basePrice ? (change / market.basePrice) * 100 : 0,
    high: price * 1.01,
    low: price * 0.99,
    volume: Math.floor(Math.random() * 10000000),
    history: [],
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

function tickMarket(market) {
  const previous = market.price;
  const tick = (Math.random() - 0.5) * previous * (market.volatility / 100);
  const price = Math.max(0.01, previous + tick);
  const change = price - market.basePrice;
  market.price = price;
  market.change = change;
  market.changePercent = market.basePrice ? (change / market.basePrice) * 100 : 0;
  market.high = Math.max(market.high, price);
  market.low = Math.min(market.low, price);
  market.volume += Math.floor(Math.random() * 50000);
  market.history.push(price);
  if (market.history.length > 60) market.history.shift();
  market.updatedAt = new Date().toISOString();
}

function getMarket(symbol) {
  const market = findMarket(symbol);
  if (!market) return null;
  tickMarket(market);
  return clone(market);
}

function getMarkets() {
  return marketCatalog.map((market) => clone(marketState.get(market.symbol)));
}

function getStocks() {
  return marketCatalog.filter((market) => market.type === "stocks").map((market) => clone(marketState.get(market.symbol)));
}

function getHistory(symbol, points = 60) {
  const market = findMarket(symbol);
  if (!market) return null;
  const normalizedPoints = Math.min(500, Math.max(2, Number(points) || 60));
  const history = market.history.slice(-normalizedPoints);
  while (history.length < normalizedPoints) {
    const previous = history.length ? history[history.length - 1] : market.price;
    const next = Math.max(0.01, previous * (1 + (Math.random() - 0.5) * (market.volatility / 100)));
    history.push(next);
  }
  return {
    symbol: market.symbol,
    name: market.name,
    points: normalizedPoints,
    history
  };
}

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

async function fetchExternalMarketData(market) {
  const normalized = normalizeSymbol(market.symbol);
  if (["BTC", "ETH", "SOL", "BNB"].includes(normalized)) {
    const ids = marketCatalog.filter((item) => item.type === "crypto").map((item) => item.symbol).join(",");
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`, {
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const payload = await response.json();
      const value = payload?.[normalized.toLowerCase()]?.usd;
      if (Number.isFinite(value) && value > 0) {
        market.price = value;
        market.change = value - market.basePrice;
        market.changePercent = market.basePrice ? (market.change / market.basePrice) * 100 : 0;
      }
    }
    return;
  }

  if (["XAU", "XAG"].includes(normalized)) {
    const response = await fetch(`https://api.gold-api.com/price/${normalized}`, {
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const payload = await response.json();
      const value = Number(payload?.price ?? payload?.data?.price ?? payload?.[normalized.toLowerCase()]?.usd);
      if (Number.isFinite(value) && value > 0) {
        market.price = value;
        market.change = value - market.basePrice;
        market.changePercent = market.basePrice ? (market.change / market.basePrice) * 100 : 0;
      }
    }
  }
}

async function refreshExternalMarkets() {
  await Promise.all(marketCatalog.filter((market) => ["BTC", "ETH", "SOL", "BNB", "XAU", "XAG"].includes(market.symbol)).map(fetchExternalMarketData));
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
    await refreshExternalMarkets().catch(() => undefined);
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
    const data = marketCatalog.filter((market) => market.type === type).map((market) => clone(marketState.get(market.symbol)));
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
