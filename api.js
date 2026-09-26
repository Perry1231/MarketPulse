(() => {
  const API_BASE = "/api";

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json", ...(options.headers || {}) },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `API error ${response.status}`);
    return payload.data !== undefined ? payload.data : payload;
  }

  window.MarketPulseAPI = {
    getMarkets: () => request("/markets"),
    getMarket: (symbol) => request(`/market/${encodeURIComponent(symbol)}`),
    getStocks: () => request("/stocks"),
    getHistory: (symbol, range = "1d") => request(`/markets/${encodeURIComponent(symbol)}/history?range=${encodeURIComponent(range)}`),
    postContact: (data) => request("/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
  };
})();
