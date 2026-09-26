/* MarketPulse shared theme module.
 *
 * Adds a dark-theme toggle button to the nav panel on every page.
 * The choice is stored in localStorage ("theme") and re-applied on load,
 * before the page is painted (this script must be included in <head>).
 *
 * Dark styles are scoped under html[data-theme="dark"] and cover every
 * element used across the site: market cards, live tiles, filter buttons,
 * modal/chart/table (market-page.js), about card and footers.
 */
(() => {
  const THEME_KEY = "theme";

  const DARK_CSS = `
    html[data-theme="dark"] body {
      background: #0f172a !important;
      color: #e2e8f0 !important;
    }
    html[data-theme="dark"] .theme-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      color: #fff;
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    html[data-theme="dark"] .theme-btn:hover { background: rgba(255,255,255,0.2); }

    /* Cards and live tiles (index.html) */
    html[data-theme="dark"] .market-card,
    html[data-theme="dark"] .tile,
    html[data-theme="dark"] .mp-card,
    html[data-theme="dark"] .about-card {
      background: #1e293b !important;
      border-color: #334155 !important;
    }
    html[data-theme="dark"] .market-card:hover,
    html[data-theme="dark"] .mp-card:hover {
      border-color: #3b82f6 !important;
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15) !important;
    }
    html[data-theme="dark"] .market-card__title,
    html[data-theme="dark"] .tile-title,
    html[data-theme="dark"] .tile-price,
    html[data-theme="dark"] .live-section h2,
    html[data-theme="dark"] .about-card h1,
    html[data-theme="dark"] .mp-filter-title,
    html[data-theme="dark"] .mp-card-symbol,
    html[data-theme="dark"] .mp-card-price,
    html[data-theme="dark"] .mp-modal-title {
      color: #f1f5f9 !important;
    }
    html[data-theme="dark"] .market-card__subtitle,
    html[data-theme="dark"] .tile-meta,
    html[data-theme="dark"] .tile-change,
    html[data-theme="dark"] .about-card p,
    html[data-theme="dark"] .mp-card-name,
    html[data-theme="dark"] .mp-card-category {
      color: #94a3b8 !important;
    }

    /* Filter buttons (market pages) */
    html[data-theme="dark"] .mp-filter-btn {
      background: #1e293b !important;
      color: #cbd5e1 !important;
    }
    html[data-theme="dark"] .mp-filter-btn:hover { background: #334155 !important; }
    html[data-theme="dark"] .mp-filter-btn.active {
      background: #2563eb !important;
      color: #fff !important;
    }

    /* Modal, chart, table (market-page.js) */
    html[data-theme="dark"] .mp-modal { background: #16213a !important; }
    html[data-theme="dark"] .mp-modal-header {
      background: #1e293b !important;
      border-bottom-color: #334155 !important;
    }
    html[data-theme="dark"] .mp-modal-close { color: #94a3b8 !important; }
    html[data-theme="dark"] .mp-modal-close:hover { color: #f87171 !important; }
    html[data-theme="dark"] .mp-range-btn {
      background: #1e293b !important;
      border-color: #334155 !important;
      color: #cbd5e1 !important;
    }
    html[data-theme="dark"] .mp-range-btn.active {
      background: #2563eb !important;
      color: #fff !important;
      border-color: #2563eb !important;
    }
    html[data-theme="dark"] .mp-range-label,
    html[data-theme="dark"] .mp-chart-meta { color: #94a3b8 !important; }
    html[data-theme="dark"] .mp-table th {
      background: #1e293b !important;
      color: #94a3b8 !important;
    }
    html[data-theme="dark"] .mp-table th,
    html[data-theme="dark"] .mp-table td { border-bottom-color: #334155 !important; }
    html[data-theme="dark"] .mp-table tbody tr:hover { background: #26334d !important; }
    html[data-theme="dark"] .mp-table tr.row-selected { background: #1e3a5f !important; }
  `;

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("themeBtn");
    if (btn) {
      btn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
      btn.title = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    }
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  function addThemeButton() {
    const nav = document.getElementById("nav");
    if (!nav || document.getElementById("themeBtn")) return;
    const btn = document.createElement("button");
    btn.id = "themeBtn";
    btn.className = "theme-btn";
    btn.addEventListener("click", toggleTheme);
    const langSwitcher = nav.querySelector(".lang-switcher");
    if (langSwitcher) nav.insertBefore(btn, langSwitcher);
    else nav.appendChild(btn);
    applyTheme(document.documentElement.getAttribute("data-theme") || "light");
  }

  const style = document.createElement("style");
  style.textContent = DARK_CSS;
  document.head.appendChild(style);

  applyTheme(localStorage.getItem(THEME_KEY) || "light");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addThemeButton);
  } else {
    addThemeButton();
  }
})();
