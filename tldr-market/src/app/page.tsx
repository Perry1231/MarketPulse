'use client';

import { useState, useEffect, useCallback } from 'react';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  pct: number;
}

interface FlashedItem extends MarketItem {
  flash?: 'up' | 'down';
}

const INITIAL_DATA: Record<string, FlashedItem[]> = {
  stocks: [
    { symbol: 'SPX', name: 'S&P 500', price: 7457.69, change: -76.08, pct: -1.01 },
    { symbol: 'NDX', name: 'NASDAQ', price: 25520.24, change: -361.66, pct: -1.40 },
    { symbol: 'DJI', name: 'Dow Jones', price: 52146.42, change: -406.58, pct: -0.77 },
    { symbol: 'RUT', name: 'Russell 2000', price: 2962.22, change: -12.35, pct: -0.42 },
  ],
  bonds: [
    { symbol: '10Y', name: 'US 10Y', price: 4.54, change: -0.03, pct: -0.61 },
    { symbol: '30Y', name: 'US 30Y', price: 5.06, change: -0.03, pct: -0.67 },
    { symbol: '5Y', name: '5Y Treasury', price: 4.27, change: -0.01, pct: -0.21 },
    { symbol: '3M', name: 'US 3M', price: 3.71, change: 0.01, pct: 0.27 },
  ],
  international: [
    { symbol: 'FTSE', name: 'FTSE 100', price: 10562.32, change: -38.05, pct: -0.36 },
    { symbol: 'DAX', name: 'DAX', price: 24873.71, change: 42.73, pct: 0.17 },
    { symbol: 'N225', name: 'Nikkei 225', price: 64141.12, change: -2694.38, pct: -4.03 },
    { symbol: 'SSEC', name: 'Shanghai Composite', price: 3796.28, change: 32.13, pct: 0.85 },
  ],
  commodities: [
    { symbol: 'XAU', name: 'Gold', price: 4039.00, change: 20.20, pct: 0.50 },
    { symbol: 'XAG', name: 'Silver', price: 57.56, change: 1.23, pct: 2.19 },
    { symbol: 'WTI', name: 'Crude Oil WTI', price: 80.28, change: -1.50, pct: -1.83 },
    { symbol: 'NG', name: 'Natural Gas', price: 2.84, change: -0.08, pct: -2.58 },
  ],
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', price: 64855.51, change: 175.28, pct: 0.27 },
    { symbol: 'ETH', name: 'Ethereum', price: 1889.21, change: 18.00, pct: 0.96 },
    { symbol: 'BNB', name: 'Binance Coin', price: 570.72, change: 0.31, pct: 0.05 },
    { symbol: 'SOL', name: 'Solana', price: 77.06, change: 0.72, pct: 0.94 },
  ],
  forex: [
    { symbol: 'EURUSD', name: 'EUR/USD', price: 1.14, change: -0.00, pct: -0.06 },
    { symbol: 'GBPUSD', name: 'GBP/USD', price: 1.35, change: 0.00, pct: 0.13 },
    { symbol: 'USDJPY', name: 'USD/JPY', price: 162.31, change: -0.04, pct: -0.03 },
    { symbol: 'USDCHF', name: 'USD/CHF', price: 0.81, change: 0.00, pct: 0.05 },
  ],
};

type SectionKey = keyof typeof INITIAL_DATA;

function generateSparkline(up: boolean) {
  const points: string[] = [];
  let y = 16;
  for (let i = 0; i <= 20; i++) {
    y += (Math.random() - 0.5) * 6;
    y = Math.max(4, Math.min(28, y));
    points.push(`${i * 10},${y}`);
  }
  const color = up ? '#4ade80' : '#f87171';
  return (
    <svg viewBox="0 0 200 32" preserveAspectRatio="none" className="w-full h-full">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points.join(' ')} />
    </svg>
  );
}

function MarketGrid({ title, items }: { title: string; items: FlashedItem[] }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-200 mb-4 border-l-4 border-blue-500 pl-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const isUp = item.change >= 0;
          return (
            <div
              key={item.symbol}
              className={`relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm p-4 transition-all hover:border-gray-600 ${
                item.flash === 'up' ? 'flash-green' : item.flash === 'down' ? 'flash-red' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-400">{item.symbol}</div>
                  <div className="text-xs text-gray-500">{item.name}</div>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-white">
                  {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`flex items-center gap-1 text-sm ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                <span>{isUp ? '↑' : '↓'}</span>
                <span>
                  {isUp ? '+' : ''}
                  {item.change.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isUp ? '+' : ''}
                  {item.pct.toFixed(2)}%)
                </span>
              </div>
              <div className="mt-3 h-8">{generateSparkline(isUp)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState<Record<string, FlashedItem[]>>(INITIAL_DATA);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsLeft, setSecondsLeft] = useState(5);

  const tick = useCallback(() => {
    setData((prev) => {
      const next: Record<string, FlashedItem[]> = {};
      for (const key of Object.keys(prev) as SectionKey[]) {
        next[key] = prev[key].map((item) => {
          const volatility = item.price * 0.0004;
          const move = (Math.random() - 0.5) * 2 * volatility;
          const price = item.price + move;
          const change = item.change + move;
          const prior = price - change;
          const pct = prior !== 0 ? (change / prior) * 100 : 0;
          return { ...item, price, change, pct };
        }).map((item, idx) => {
          const prevItem = prev[key][idx];
          const flash = item.price > prevItem.price ? 'up' : item.price < prevItem.price ? 'down' : undefined;
          return { ...item, flash };
        });
      }
      setLastUpdated(new Date());
      setSecondsLeft(5);
      return next;
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          tick();
          return 5;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                TL;DR
              </a>
              <div className="hidden md:flex items-center gap-1 ml-4">
                <button className="px-3 py-1 text-sm rounded-md transition-colors bg-gray-800 text-white">1D</button>
                <button className="px-3 py-1 text-sm rounded-md transition-colors text-gray-400 hover:text-gray-200">1W</button>
                <button className="px-3 py-1 text-sm rounded-md transition-colors text-gray-400 hover:text-gray-200">1M</button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
              <button
                onClick={tick}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MarketGrid title="US Stock Indices" items={data.stocks} />
        <MarketGrid title="Bond Rates" items={data.bonds} />
        <MarketGrid title="International Indices" items={data.international} />
        <MarketGrid title="Top Commodities" items={data.commodities} />
        <MarketGrid title="Top Cryptocurrencies" items={data.crypto} />
        <MarketGrid title="Top Currency Pairs" items={data.forex} />

        <section className="mb-10 bg-gradient-to-r from-gray-900/80 to-gray-800/50 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-200">Daily Market Summary</h2>
            <div className="text-xs text-gray-500">Updated {lastUpdated.toLocaleTimeString()}</div>
          </div>
          <div className="text-gray-300 leading-relaxed">
            <p className="mb-4">
              <strong>TL;DR:</strong> Risk assets had a mixed session as investors weighed <strong>geopolitical tensions</strong> against
              resilient economic data. Tech led losses while energy and defensives found buyers. Bonds firmed on haven demand.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-400">
              <div>
                <h3 className="text-gray-300 font-medium mb-2">📉 Stocks (US)</h3>
                <p>Wall Street sold off broadly. Nasdaq -1.2%, S&P 500 -0.8%. Main drivers: geopolitical risk + tech valuation anxiety after Alphabet AI product delay.</p>
              </div>
              <div>
                <h3 className="text-gray-300 font-medium mb-2">🪙 Cryptocurrencies</h3>
                <p>Bitcoin softened ~1% as risk appetite faded. Geopolitical tension pushed traders toward less risky assets.</p>
              </div>
              <div>
                <h3 className="text-gray-300 font-medium mb-2">🛢️ Commodities</h3>
                <p>Oil jumped 3%+ on Hormuz disruption fears. Gold gained ~1% as classic haven bid.</p>
              </div>
              <div>
                <h3 className="text-gray-300 font-medium mb-2">📊 Bonds & Rates</h3>
                <p>U.S. 10Y yield steady around 4.56%. Short-term treasuries saw some selling while longer maturities found demand.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
          <p>Skip the fluff, enjoy life</p>
          <p className="mt-2">
            Last updated: {lastUpdated.toLocaleString()} | Next refresh in: {secondsLeft}s
          </p>
        </div>
      </footer>
    </div>
  );
}