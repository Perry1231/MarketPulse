/* MarketPulse shared market page module.
 *
 * Renders a full market-category page (cards + chart modal + data table)
 * from a small config. Data comes from the local /api endpoints, which are
 * backed by real Yahoo Finance / CoinGecko / gold-api prices.
 *
 * Usage in a page:
 *   <main id="mpRoot"></main>
 *   <script>window.MP_CONFIG = { symbols: ["BTC","ETH"], filters: [...] };</script>
 *   <script src="api.js"></script>
 *   <script src="market-page.js"></script>
 */
(() => {
  const MP_LABELS = {
    en: { live: "Live", loading: "Loading...", symbol: "Symbol", company: "Company", price: "Price", change: "Change%", high: "High", low: "Low", volume: "Volume", range: "Range", data: "Data", noData: "No data yet", refresh: "Refresh", now: "Now" },
    uk: { live: "Live", loading: "Завантаження...", symbol: "Символ", company: "Компанія", price: "Ціна", change: "Зміна%", high: "Макс", low: "Мін", volume: "Обсяг", range: "Діапазон", data: "Дані", noData: "Даних ще немає", refresh: "Оновити", now: "Зараз" },
    de: { live: "Live", loading: "Wird geladen...", symbol: "Symbol", company: "Unternehmen", price: "Preis", change: "Änderung%", high: "Hoch", low: "Tief", volume: "Volumen", range: "Bereich", data: "Daten", noData: "Noch keine Daten", refresh: "Aktualisieren", now: "Aktuell" },
    fr: { live: "Live", loading: "Chargement...", symbol: "Symbole", company: "Entreprise", price: "Prix", change: "Variation%", high: "Haut", low: "Bas", volume: "Volume", range: "Plage", data: "Données", noData: "Pas encore de données", refresh: "Actualiser", now: "Actuel" },
    ja: { live: "ライブ", loading: "読み込み中...", symbol: "シンボル", company: "企業", price: "価格", change: "変動%", high: "高値", low: "安値", volume: "出来高", range: "範囲", data: "データ", noData: "データがありません", refresh: "更新", now: "現在" }
  };

  const CSS = `
    .mp-filter-bar { max-width: 1200px; margin: 110px auto 2rem; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .mp-filter-title { font-size: 1.5rem; font-weight: 700; color: #111827; display:flex; align-items:center; gap:1rem; }
    .mp-filter-buttons { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .mp-filter-btn { background: #f3f4f6; border: 2px solid transparent; padding: 0.5rem 1.25rem; border-radius: 20px; font-size: 0.9rem; font-weight: 500; color: #6b7280; cursor: pointer; transition: all 0.2s; }
    .mp-filter-btn:hover { background: #e5e7eb; }
    .mp-filter-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; }
    .mp-refresh-btn { background: #2563eb; border: none; color: #fff; width: 2.4rem; height: 2.4rem; border-radius: 50%; cursor: pointer; font-size: 1.1rem; transition: background 0.2s, transform 0.4s; }
    .mp-refresh-btn:hover { background: #1d4ed8; }
    .mp-refresh-btn.spinning { transform: rotate(360deg); transition: transform 0.6s; }
    .mp-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; padding: 0 2rem 3rem; max-width: 1200px; margin: 0 auto; }
    .mp-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.1rem 1.25rem; cursor: pointer; transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s; color: inherit; }
    .mp-card:hover { border-color: #2563eb; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.12); transform: translateY(-2px); }
    .mp-card.hidden { display: none; }
    .mp-card-top { display: flex; justify-content: space-between; align-items: baseline; }
    .mp-card-symbol { font-weight: 700; font-size: 1.05rem; color: #111827; }
    .mp-card-status { font-size: 0.7rem; font-weight: 600; color: #9ca3af; }
    .mp-card-status.live { color: #16a34a; }
    .mp-card-name { color: #6b7280; font-size: 0.82rem; margin-top: 0.2rem; }
    .mp-card-category { color: #2563eb; font-size: 0.68rem; font-weight: 600; margin-top: 0.35rem; text-transform: uppercase; letter-spacing: 0.4px; }
    .mp-card-price-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.7rem; }
    .mp-card-price { font-size: 1.35rem; font-weight: 700; color: #111827; }
    .mp-card-change { font-size: 0.82rem; font-weight: 600; }
    .mp-card-spark { margin-top: 0.6rem; width: 100%; height: 40px; }
    .mp-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); z-index: 2000; justify-content: center; align-items: center; padding: 2rem; }
    .mp-overlay.visible { display: flex; }
    .mp-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 900px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: mpModalIn 0.25s ease; }
    @keyframes mpModalIn { from { opacity: 0; transform: translateY(-16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .mp-modal-header { padding: 1.1rem 1.75rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; }
    .mp-modal-title { font-size: 1.3rem; font-weight: 700; color: #111827; }
    .mp-modal-title small { color: #6b7280; font-weight: 500; margin-left: 0.5rem; font-size: 0.9rem; }
    .mp-modal-close { background: none; border: none; font-size: 1.8rem; color: #6b7280; cursor: pointer; line-height: 1; }
    .mp-modal-close:hover { color: #dc2626; }
    .mp-modal-body { padding: 1.25rem 1.75rem 1.75rem; }
    .mp-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .mp-range-group { display: flex; gap: 0.4rem; }
    .mp-range-btn { padding: 0.35rem 0.85rem; font-size: 0.78rem; font-weight: 600; border-radius: 8px; border: 1px solid #e5e7eb; background: #f9fafb; color: #374151; cursor: pointer; transition: all 0.15s; }
    .mp-range-btn:hover { background: #e5e7eb; }
    .mp-range-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; }
    .mp-range-label { font-size: 0.75rem; color: #6b7280; font-weight: 500; }
    .mp-chart-wrap { height: 220px; position: relative; margin-bottom: 0.5rem; }
    .mp-chart-wrap svg { width: 100%; height: 100%; display: block; }
    .mp-chart-meta { display: flex; justify-content: space-between; font-size: 0.72rem; color: #6b7280; margin-bottom: 1rem; }
    .mp-table { width: 100%; border-collapse: collapse; }
    .mp-table th, .mp-table td { text-align: left; padding: 0.7rem 0.75rem; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; }
    .mp-table th { background: #f3f4f6; font-weight: 600; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .mp-table tbody tr:hover { background: #f9fafb; }
    .mp-table tbody tr:last-child td { border-bottom: none; }
    .mp-table tr.row-selected { background: #eff6ff; }
    .mp-positive { color: #16a34a; }
    .mp-negative { color: #dc2626; }
  `;

  const state = {
    markets: new Map(),
    history: new Map(),
    filter: "all",
    modalSymbol: null,
    modalRange: "1d",
    modalLoading: false,
    chartCache: new Map(),
    lang: (localStorage.getItem("lang") || "en"),
    config: null
  };

  function labels() {
    return MP_LABELS[state.lang] || MP_LABELS.en;
  }

  function filterLabel(f) {
    if (typeof f.label === "string") return f.label;
    return f.label[state.lang] || f.label.en || f.key;
  }

  function fmtPrice(n) {
    if (n === null || n === undefined || !Number.isFinite(n)) return "--";
    const decimals = Math.abs(n) < 2 ? 4 : 2;
    return Number(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function fmtVolume(n) {
    if (!Number.isFinite(n) || n <= 0) return "--";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
    return String(n);
  }

  function changeInfo(market) {
    if (!market || !market.isReal) return null;
    return { change: market.change || 0, percent: market.changePercent || 0 };
  }

  function fmtChange(ci) {
    if (!ci) return "--";
    const sign = ci.change >= 0 ? "+" : "";
    const pctSign = ci.percent >= 0 ? "+" : "";
    return `${sign}${fmtPrice(ci.change)} (${pctSign}${ci.percent.toFixed(2)}%)`;
  }

  function fmtTime(ts, range) {
    try {
      const locale = { en: "en-US", uk: "uk-UA", de: "de-DE", fr: "fr-FR", ja: "ja-JP" }[state.lang] || "en-US";
      if (range === "1d") {
        return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
      }
      return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(ts));
    } catch (_) {
      return "";
    }
  }

  // ── DOM helpers ──────────────────────────────────────────────────────────

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function sparkPath(values, width, height) {
    const valid = values.filter((v) => Number.isFinite(v));
    if (valid.length < 2) return null;
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const range = max - min || Math.abs(max) * 0.001 || 1;
    return valid.map((v, i) => {
      const x = (i / (valid.length - 1)) * width;
      const y = height - 2 - ((v - min) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }

  function renderSparkline(svg, values, positive) {
    const w = 200, h = 40;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.innerHTML = "";
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const points = sparkPath(values, w, h);
    if (points) {
      path.setAttribute("d", "M " + points.replace(/ /g, " L "));
      path.setAttribute("stroke", positive ? "#16a34a" : "#dc2626");
    } else {
      path.setAttribute("d", `M 0,${h / 2} L ${w},${h / 2}`);
      path.setAttribute("stroke", "#d1d5db");
    }
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  function buildLayout() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const root = document.getElementById("mpRoot");
    if (!root) return;

    const filterBar = el("div", "mp-filter-bar");
    const titleWrap = el("div", "mp-filter-title");
    const title = el("div");
    title.setAttribute("data-i18n-key", "filter_title");
    title.textContent = state.config.title || "Markets";
    titleWrap.appendChild(title);
    const refreshBtn = el("button", "mp-refresh-btn", "↻");
    refreshBtn.id = "mpRefreshBtn";
    refreshBtn.title = labels().refresh;
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.classList.add("spinning");
      await Promise.all([fetchMarkets(), fetchModalChart(true)]);
      setTimeout(() => refreshBtn.classList.remove("spinning"), 600);
    });
    titleWrap.appendChild(refreshBtn);
    filterBar.appendChild(titleWrap);

    if (state.config.filters && state.config.filters.length) {
      const btns = el("div", "mp-filter-buttons");
      state.config.filters.forEach((f) => {
        const btn = el("button", "mp-filter-btn" + (f.key === state.filter ? " active" : ""), filterLabel(f));
        btn.dataset.filterKey = f.key;
        btn.addEventListener("click", () => {
          state.filter = f.key;
          btns.querySelectorAll(".mp-filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
          renderCards();
          renderTable();
        });
        btns.appendChild(btn);
      });
      filterBar.appendChild(btns);
    }
    root.appendChild(filterBar);

    const container = el("section", "mp-container");
    container.id = "mpCards";
    state.config.symbols.forEach((symbol) => {
      const card = el("div", "mp-card");
      card.dataset.symbol = symbol;

      const top = el("div", "mp-card-top");
      const symEl = el("div", "mp-card-symbol", symbol);
      const statusEl = el("span", "mp-card-status", labels().loading);
      statusEl.dataset.role = "status";
      top.appendChild(symEl);
      top.appendChild(statusEl);
      card.appendChild(top);

      const nameEl = el("div", "mp-card-name", "—");
      nameEl.dataset.role = "name";
      card.appendChild(nameEl);

      const catEl = el("div", "mp-card-category", "");
      catEl.dataset.role = "category";
      card.appendChild(catEl);

      const priceRow = el("div", "mp-card-price-row");
      const priceEl = el("div", "mp-card-price", "--");
      priceEl.dataset.role = "price";
      const changeEl = el("div", "mp-card-change", "--");
      changeEl.dataset.role = "change";
      priceRow.appendChild(priceEl);
      priceRow.appendChild(changeEl);
      card.appendChild(priceRow);

      const spark = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      spark.className = "mp-card-spark";
      card.appendChild(spark);

      card.addEventListener("click", () => openModal(symbol));
      container.appendChild(card);
    });
    root.appendChild(container);

    const overlay = el("div", "mp-overlay");
    overlay.id = "mpOverlay";
    const modal = el("div", "mp-modal");
    const header = el("div", "mp-modal-header");
    const modalTitle = el("div", "mp-modal-title");
    modalTitle.id = "mpModalTitle";
    const closeBtn = el("button", "mp-modal-close", "×");
    closeBtn.addEventListener("click", closeModal);
    header.appendChild(modalTitle);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    const body = el("div", "mp-modal-body");
    const toolbar = el("div", "mp-toolbar");
    const rangeGroup = el("div", "mp-range-group");
    [["1d", "1D"], ["1w", "1W"], ["1m", "1M"]].forEach(([key, label]) => {
      const btn = el("button", "mp-range-btn" + (key === state.modalRange ? " active" : ""), label);
      btn.dataset.range = key;
      btn.addEventListener("click", () => {
        state.modalRange = key;
        rangeGroup.querySelectorAll(".mp-range-btn").forEach((b) => b.classList.toggle("active", b === btn));
        fetchModalChart();
      });
      rangeGroup.appendChild(btn);
    });
    const rangeLabel = el("span", "mp-range-label");
    rangeLabel.id = "mpRangeLabel";
    toolbar.appendChild(rangeGroup);
    toolbar.appendChild(rangeLabel);
    body.appendChild(toolbar);

    const chartWrap = el("div", "mp-chart-wrap");
    const chartSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chartSvg.id = "mpChart";
    chartSvg.setAttribute("viewBox", "0 0 400 220");
    chartSvg.setAttribute("preserveAspectRatio", "none");
    const chartLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    chartLine.id = "mpChartLine";
    chartLine.setAttribute("fill", "none");
    chartLine.setAttribute("stroke", "#2563eb");
    chartLine.setAttribute("stroke-width", "2");
    chartLine.setAttribute("stroke-linejoin", "round");
    chartLine.setAttribute("stroke-linecap", "round");
    chartSvg.appendChild(chartLine);
    chartWrap.appendChild(chartSvg);
    body.appendChild(chartWrap);

    const chartMeta = el("div", "mp-chart-meta");
    chartMeta.id = "mpChartMeta";
    body.appendChild(chartMeta);

    const table = el("table", "mp-table");
    const thead = el("thead");
    const headRow = el("tr");
    ["symbol", "company", "price", "change", "high", "low", "volume"].forEach((key) => {
      const th = el("th", "", labels()[key]);
      th.dataset.labelKey = key;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = el("tbody");
    tbody.id = "mpTableBody";
    table.appendChild(tbody);
    body.appendChild(table);
    modal.appendChild(body);
    overlay.appendChild(modal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
    root.appendChild(overlay);
  }

  function symbolVisible(symbol) {
    if (state.filter === "all" || !state.config.filters) return true;
    const f = state.config.filters.find((x) => x.key === state.filter);
    if (!f) return true;
    const market = state.markets.get(symbol);
    return f.categories.includes(market ? market.category : "");
  }

  function renderCards() {
    document.querySelectorAll(".mp-card").forEach((card) => {
      const symbol = card.dataset.symbol;
      const market = state.markets.get(symbol);
      card.classList.toggle("hidden", !symbolVisible(symbol));

      const statusEl = card.querySelector('[data-role="status"]');
      const nameEl = card.querySelector('[data-role="name"]');
      const catEl = card.querySelector('[data-role="category"]');
      const priceEl = card.querySelector('[data-role="price"]');
      const changeEl = card.querySelector('[data-role="change"]');
      const spark = card.querySelector("svg");

      if (!market) return;
      nameEl.textContent = market.name || "—";
      catEl.textContent = market.category || "";

      if (market.isReal) {
        statusEl.textContent = labels().live;
        statusEl.className = "mp-card-status live";
        priceEl.textContent = fmtPrice(market.price);
        const ci = changeInfo(market);
        changeEl.textContent = fmtChange(ci);
        changeEl.className = "mp-card-change " + (ci.percent >= 0 ? "mp-positive" : "mp-negative");
        const history = state.history.get(symbol) || [];
        renderSparkline(spark, history, ci.percent >= 0);
      } else {
        statusEl.textContent = labels().loading;
        statusEl.className = "mp-card-status";
        priceEl.textContent = "--";
        changeEl.textContent = "--";
        changeEl.className = "mp-card-change";
        renderSparkline(spark, [], true);
      }
    });
  }

  function renderTable() {
    const tbody = document.getElementById("mpTableBody");
    if (!tbody) return;
    const symbols = state.config.symbols.filter((s) => symbolVisible(s));
    tbody.innerHTML = "";
    symbols.forEach((symbol) => {
      const market = state.markets.get(symbol);
      const tr = el("tr");
      if (symbol === state.modalSymbol) tr.classList.add("row-selected");
      const symTd = el("td");
      symTd.style.fontWeight = "600";
      symTd.textContent = symbol;
      tr.appendChild(symTd);
      tr.appendChild(el("td", "", market ? market.name : "—"));
      const priceTd = el("td", "", market && market.isReal ? fmtPrice(market.price) : "--");
      tr.appendChild(priceTd);
      const ci = market ? changeInfo(market) : null;
      const pctTd = el("td", ci ? (ci.percent >= 0 ? "mp-positive" : "mp-negative") : "", ci ? `${ci.percent >= 0 ? "+" : ""}${ci.percent.toFixed(2)}%` : "--");
      tr.appendChild(pctTd);
      tr.appendChild(el("td", "", market && market.isReal ? fmtPrice(market.high) : "--"));
      tr.appendChild(el("td", "", market && market.isReal ? fmtPrice(market.low) : "--"));
      tr.appendChild(el("td", "", market && market.isReal ? fmtVolume(market.volume) : "--"));
      tr.addEventListener("click", () => {
        openModal(symbol);
      });
      tbody.appendChild(tr);
    });
  }

  // ── Modal chart with REAL history from the server ────────────────────────

  async function fetchModalChart(force) {
    const symbol = state.modalSymbol;
    if (!symbol) return;
    const range = state.modalRange;
    const line = document.getElementById("mpChartLine");
    const meta = document.getElementById("mpChartMeta");
    const rangeLabel = document.getElementById("mpRangeLabel");
    if (!line || !meta) return;

    const cacheKey = `${symbol}:${range}`;
    const cached = state.chartCache.get(cacheKey);
    let points = null;
    if (cached && !force && Date.now() - cached.at < 60000) {
      points = cached.points;
    } else {
      state.modalLoading = true;
      rangeLabel.textContent = `${labels().range}: ${range.toUpperCase()} — ${labels().loading}`;
      try {
        const data = await window.MarketPulseAPI.getHistory(symbol, range);
        points = (data.history || []).map((p) => ({ t: p.t, price: p.price }));
        if (points.length) state.chartCache.set(cacheKey, { points, at: Date.now() });
      } catch (error) {
        console.warn("history fetch failed:", error);
      }
      state.modalLoading = false;
    }

    rangeLabel.textContent = `${labels().range}: ${range.toUpperCase()}`;

    // Draw chart
    const w = 400, h = 220;
    line.setAttribute("points", "");
    meta.innerHTML = "";
    if (!points || points.length < 2) {
      meta.appendChild(el("span", "", labels().noData));
      return;
    }
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const rangeSpan = max - min || Math.abs(max) * 0.001 || 1;
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * (w - 8) + 4;
      const y = h - 10 - ((p.price - min) / rangeSpan) * (h - 30);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    line.setAttribute("points", coords.join(" "));
    const positive = prices[prices.length - 1] >= prices[0];
    line.setAttribute("stroke", positive ? "#16a34a" : "#dc2626");

    meta.appendChild(el("span", "", `${fmtTime(points[0].t, range)} — ${fmtTime(points[points.length - 1].t, range)}`));
    const mid = el("span", "", `min ${fmtPrice(min)} · max ${fmtPrice(max)}`);
    mid.className = positive ? "mp-positive" : "mp-negative";
    meta.appendChild(mid);
    meta.appendChild(el("span", "", `${labels().now}: ${fmtPrice(prices[prices.length - 1])}`));
  }

  function openModal(symbol) {
    state.modalSymbol = symbol;
    state.modalRange = "1d";
    const market = state.markets.get(symbol);
    const title = document.getElementById("mpModalTitle");
    if (title) {
      title.innerHTML = "";
      title.appendChild(document.createTextNode(symbol));
      if (market && market.name) title.appendChild(el("small", "", market.name));
    }
    document.querySelectorAll(".mp-range-btn").forEach((b) => b.classList.toggle("active", b.dataset.range === "1d"));
    renderTable();
    fetchModalChart();
    document.getElementById("mpOverlay").classList.add("visible");
  }

  function closeModal() {
    state.modalSymbol = null;
    const overlay = document.getElementById("mpOverlay");
    if (overlay) overlay.classList.remove("visible");
  }

  // ── Data polling ─────────────────────────────────────────────────────────

  async function fetchMarkets() {
    try {
      const markets = await window.MarketPulseAPI.getMarkets();
      if (!Array.isArray(markets)) return;
      markets.forEach((market) => {
        if (!state.config.symbols.includes(market.symbol)) return;
        state.markets.set(market.symbol, market);
        if (Array.isArray(market.history) && market.history.length > 1) {
          const prev = state.history.get(market.symbol) || [];
          state.history.set(market.symbol, prev.length >= market.history.length ? prev : [...market.history]);
        }
        if (market.isReal) {
          const arr = state.history.get(market.symbol) || [];
          if (!arr.length || arr[arr.length - 1] !== market.price) {
            arr.push(market.price);
            if (arr.length > 120) arr.shift();
            state.history.set(market.symbol, arr);
          }
        }
      });
      renderCards();
      renderTable();
      const title = document.getElementById("mpModalTitle");
      if (state.modalSymbol && title) {
        const market = state.markets.get(state.modalSymbol);
        title.innerHTML = "";
        title.appendChild(document.createTextNode(state.modalSymbol));
        if (market && market.name) title.appendChild(el("small", "", market.name));
      }
    } catch (error) {
      console.warn("Market data fetch failed:", error);
    }
  }

  function setLanguage(lang) {
    if (!MP_LABELS[lang]) return;
    state.lang = lang;
    document.querySelectorAll(".mp-filter-btn").forEach((btn) => {
      const f = state.config.filters && state.config.filters.find((x) => x.key === btn.dataset.filterKey);
      if (f) btn.textContent = filterLabel(f);
    });
    document.querySelectorAll("[data-label-key]").forEach((th) => {
      th.textContent = labels()[th.dataset.labelKey];
    });
    const refreshBtn = document.getElementById("mpRefreshBtn");
    if (refreshBtn) refreshBtn.title = labels().refresh;
    fetchModalChart();
  }

  window.MarketPage = { setLanguage, refresh: fetchMarkets };

  document.addEventListener("DOMContentLoaded", () => {
    state.config = window.MP_CONFIG;
    if (!state.config || !Array.isArray(state.config.symbols)) return;
    buildLayout();
    fetchMarkets();
    setInterval(fetchMarkets, 5000);
  });
})();
