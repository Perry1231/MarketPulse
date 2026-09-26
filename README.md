# MarketPulse

MarketPulse is a web-based financial market dashboard for monitoring stocks, cryptocurrencies, commodities, currencies, indices, and bonds in real time.

The project combines a lightweight Node.js backend with a browser-based interface to provide market data, live price updates, historical charts, market categories, and a simple API.

## Features

* Real-time market data
* Stock market monitoring
* Cryptocurrency prices
* Forex rates
* Energy markets
* Precious metals
* Major market indices
* Bond market data
* Historical price data
* Automatic market updates
* Live price simulation between external API updates
* Market filtering and categorization
* Interactive market cards and charts
* Multi-language interface
* Contact form with API support
* Built-in REST API
* Static file serving through the Node.js server
* No external backend framework required

## Supported Markets

MarketPulse currently includes several market categories.

### Stocks

Examples include:

* Apple (AAPL)
* Microsoft (MSFT)
* Alphabet (GOOGL)
* Amazon (AMZN)
* Tesla (TSLA)
* Meta (META)
* NVIDIA (NVDA)
* Netflix (NFLX)
* Disney (DIS)
* Nike (NKE)
* Adobe (ADBE)
* Qualcomm (QCOM)
* PayPal (PYPL)
* Intel (INTC)
* Costco (COST)
* Verizon (VZ)
* ASML
* Uber (UBER)

### Cryptocurrency

* Bitcoin (BTC)
* Ethereum (ETH)
* Solana (SOL)
* BNB

### Forex

* EUR/USD
* USD/JPY
* GBP/USD
* UAH/USD

### Commodities

* Brent Crude Oil
* WTI Crude Oil
* Gold
* Silver

### Indices

* S&P 500
* Nasdaq Composite
* Dow Jones Industrial Average

### Bonds

* US 10-Year Treasury

## Data Sources

MarketPulse uses several external data sources depending on the market.

### Yahoo Finance

Used for:

* Stocks
* Forex
* Energy
* Market indices
* US Treasury data

### CoinGecko

Used for cryptocurrency prices:

* BTC
* ETH
* SOL
* BNB

### Gold API

Used for:

* Gold
* Silver

The server periodically requests external market data and updates its internal market state.

## Live Data Architecture

MarketPulse uses a hybrid data model.

External APIs are refreshed periodically, while the frontend receives continuously changing market values from the local server.

The server performs external data refreshes every 15 seconds:

```text
External APIs
     |
     v
MarketPulse Server
     |
     v
Internal Market State
     |
     +----> REST API
     |
     +----> Web Interface
```

Between external updates, the server performs small price fluctuations every second. This keeps the dashboard visually live while maintaining the latest external market data as the reference point.

If external data is unavailable, the application can fall back to locally simulated market data.

## Technology Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Responsive grid-based UI
* LocalStorage for language preferences

### Backend

* Node.js
* Native `http` module
* Native `fetch`
* REST API
* JSON

### External APIs

* Yahoo Finance
* CoinGecko
* Gold API

The project intentionally avoids heavy backend frameworks and external npm dependencies.

## Project Structure

```text
MarketPulse/
│
├── index.html          # Main dashboard
├── stocks.html         # Stocks and market analysis interface
├── about.html          # About page
├── services.html       # Services page
├── account.html        # Account page
├── contact.html        # Contact page
│
├── server.js           # Node.js server and REST API
├── api.js              # API-related frontend logic
├── convert.js          # Conversion utility
├── white.html          # Additional page
│
├── package.json        # Node.js project configuration
└── README.md           # Project documentation
```

## REST API

MarketPulse provides a built-in REST API.

### Health Check

```http
GET /api/health
```

Returns the current server status.

Example:

```json
{
  "status": "ok",
  "time": "2026-01-01T12:00:00.000Z"
}
```

### API Information

```http
GET /api
```

Returns the available API endpoints.

### All Markets

```http
GET /api/markets
```

Returns all supported market instruments.

### Single Market

```http
GET /api/markets/:symbol
```

or:

```http
GET /api/market/:symbol
```

Example:

```http
GET /api/markets/AAPL
```

### Market History

```http
GET /api/markets/:symbol/history?points=60
```

Example:

```http
GET /api/markets/BTC/history?points=60
```

The `points` parameter controls the number of historical data points returned.

### Stocks

```http
GET /api/stocks
```

Returns stocks, energy markets, and precious metals used by the stocks dashboard.

### Market Categories

The API also supports category endpoints:

```http
GET /api/stocks
GET /api/forex
GET /api/crypto
GET /api/indices
GET /api/bonds
GET /api/energy
GET /api/metals
```

### Contact

```http
POST /api/contact
```

Accepts:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}
```

The server validates the submitted information and stores the messages in memory.

## Installation

### Requirements

* Node.js 18 or newer
* Internet connection for external market APIs

Check your Node.js version:

```bash
node --version
```

### Clone the repository

```bash
git clone https://github.com/Perry1231/MarketPulse.git
cd MarketPulse
```

### Install dependencies

The project currently has no external npm dependencies, but you can initialize the project with:

```bash
npm install
```

## Running the Project

Start the server:

```bash
npm start
```

The default server address is:

```text
http://127.0.0.1:3000
```

Open it in your browser:

```text
http://127.0.0.1:3000
```

The same server provides both the frontend and API.

## Development

You can also run:

```bash
npm run dev
```

The current development setup uses the same Node.js server without a separate development framework.

## Configuration

The server supports the following environment variables.

### PORT

Changes the server port.

```bash
PORT=8080
```

### HOST

Changes the server host.

```bash
HOST=0.0.0.0
```

Example:

```bash
PORT=8080 HOST=0.0.0.0 npm start
```

## Language Support

The interface includes a language selector with:

* English
* German
* French
* Japanese
* Ukrainian

The selected language is stored in browser `localStorage` and reused on subsequent visits.

## Market Data Fallback

MarketPulse is designed to continue functioning when external market providers are unavailable.

Each market has a base price and volatility configuration.

When real market data is unavailable, the server generates simulated price movements based on the configured volatility.

This makes the dashboard usable for:

* UI development
* frontend testing
* API testing
* demonstrations
* local development

The simulated values should not be considered real financial market data.

## Security Considerations

MarketPulse is currently designed primarily as a local/demo application.

The server includes several basic protections:

* Request body size limit
* JSON validation
* Email format validation
* Static path traversal protection
* HTTP error handling
* CORS headers
* API error responses

The project is not intended to be used as a production financial trading platform without additional security, authentication, persistence, monitoring, and validation.

## Limitations

Current limitations include:

* Contact messages are stored only in memory
* No user authentication system
* No persistent database
* No trading functionality
* No portfolio management
* External API availability can affect real market data
* Live one-second movement is partially simulated
* Market data should not be treated as an investment or trading recommendation

## Future Development

Potential improvements include:

* User authentication
* Personal portfolios
* Watchlists
* Price alerts
* Persistent database
* Advanced technical indicators
* Candlestick charts
* Portfolio performance tracking
* WebSocket-based market streaming
* More market providers
* Improved mobile interface
* Admin dashboard
* User preferences
* Notification system
* Market news integration
* More detailed historical data
* Docker support
* Automated testing
* Production deployment configuration

## Disclaimer

MarketPulse is an educational and software-development project.

Market information displayed by the application may be delayed, simulated, incomplete, or unavailable. Nothing provided by MarketPulse should be interpreted as financial, investment, or trading advice.

Always verify financial information using appropriate professional and official sources before making financial decisions.

## License

This project does not currently specify a license.

If you intend to allow others to use, modify, or distribute the project, consider adding an appropriate open-source license.

## Author

**Vladyslav Vytrykysh**

GitHub: [Perry1231](https://github.com/Perry1231)

Repository: [Perry1231/MarketPulse](https://github.com/Perry1231/MarketPulse)
