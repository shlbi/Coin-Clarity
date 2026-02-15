# CoinClarity - Crypto Risk Analysis Platform

A modern, minimal crypto risk analysis platform built with React, TypeScript, Tailwind CSS, and TanStack Query.

## Features

- **Token Risk Analysis**: Comprehensive risk scoring (0-100) with detailed signals
- **Real-time Price Tracking**: Live price updates with 24h change percentages
- **Smart Search**: Search by token name, symbol, address, or paste Etherscan/DexScreener URLs
- **Risk Intelligence**: Categorized risk tiers (Low, Medium, High, Extreme) with color-coded indicators
- **Token Metrics**: Liquidity, FDV, holder concentration, contract verification status
- **Dashboard**: Overview of recent analysis, market stats, and alerts
- **Multi-chain Support**: Ethereum and Base networks

## Design Philosophy

CoinClarity follows a **minimal, clean aesthetic** inspired by Apple, Coinbase, and Robinhood:

- No neon effects or heavy gradients
- Generous 8px spacing system
- Subtle shadows and clean borders
- Professional Inter font family
- Risk-appropriate color coding

### Color Palette

**Light Theme:**
- Background: `#F8FAFC`
- Cards: `#FFFFFF`
- Borders: `#E5E7EB`
- Primary Text: `#111827`
- Secondary Text: `#6B7280`
- Primary Accent: `#2563EB`

**Risk Colors:**
- Low (0-30): `#16A34A` (Green)
- Medium (31-59): `#CA8A04` (Yellow)
- High (60-79): `#EA580C` (Orange)
- Extreme (80-100): `#DC2626` (Red)

## Tech Stack

- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router 7** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library
- **Lucide React** - Icons

## Project Structure

```
/src
  /app
    /components
      - TopNav.tsx           # Global navigation bar
      - GlobalSearch.tsx     # Smart search with autocomplete
      - StatCard.tsx         # Dashboard stat cards
      - TokenRow.tsx         # Token list item
      - RiskBadge.tsx        # Risk tier badge
      - RiskScorePanel.tsx   # Risk score display
      - SignalsList.tsx      # Risk signals display
      - MetricsGrid.tsx      # Token metrics grid
      - LoadingSkeleton.tsx  # Loading states
    /pages
      - Dashboard.tsx        # Main dashboard page
      - TokenReport.tsx      # Token analysis report page
      - RiskEngine.tsx       # Risk engine page (placeholder)
      - Market.tsx           # Market page (placeholder)
      - Alerts.tsx           # Alerts page (placeholder)
    /ui                      # shadcn/ui components
    - App.tsx                # Main app component with routing
  /lib
    - api.ts                 # API client and utilities
    - mockData.ts            # Mock data for development
  /styles
    - fonts.css              # Font imports
    - tailwind.css           # Tailwind configuration
    - theme.css              # Theme tokens
    - index.css              # Global styles
```

## API Integration

The app expects a backend API with the following endpoints:

### POST /analyze
Analyze a token and return risk report or processing status.

**Request:**
```json
{
  "chain": "ethereum" | "base",
  "address": "0x..."
}
```

**Response (Immediate):**
```json
{
  "token": {
    "chain": "ethereum",
    "address": "0x...",
    "name": "Token Name",
    "symbol": "TKN"
  },
  "riskScore": 18,
  "riskTier": "Low",
  "signals": [...],
  "metrics": {...},
  "updatedAt": "2026-02-15T..."
}
```

**Response (Processing):**
```json
{
  "status": "processing",
  "job_id": "abc123"
}
```

### GET /report/{chain}/{address}
Fetch existing analysis report.

**Response:** Same as POST /analyze (immediate response)

### GET /price/{chain}/{address}
Get current price data for a token.

**Response:**
```json
{
  "priceUsd": 8.42,
  "change24hPct": 2.34
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Install Dependencies

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Features in Detail

### Global Search
- Search by token name, symbol, or address
- Paste Etherscan or DexScreener URLs (auto-extracts address)
- Chain selector for addresses (Ethereum/Base)
- Clean autocomplete dropdown

### Dashboard
- **Stats Cards**: Tokens scanned, high-risk tokens, market sentiment, active alerts
- **Recent Tokens**: List of recently analyzed tokens with risk scores
- **Risk Intelligence Panel**: Featured risk analysis with top signals

### Token Report Page
- **Automatic Analysis**: Triggers analysis on page load
- **Polling**: If processing, polls every 2 seconds for results
- **Live Price Updates**: Refreshes every 15 seconds
- **Risk Breakdown**: Detailed signals with severity indicators
- **Metrics Grid**: Comprehensive token metrics with visual indicators
- **Evidence Links**: External verification links for signals

### Data Handling
- **TanStack Query**: Automatic caching, refetching, and error handling
- **Mock Data Fallback**: Uses mock data when API is unavailable
- **Null-safe Rendering**: Displays "—" for missing data
- **Loading States**: Skeleton screens during data fetching

## Utility Functions

### Format Utilities
- `formatPrice(number)`: Format prices with proper decimals
- `formatLargeNumber(number)`: Convert to K/M/B notation
- `formatPercent(number)`: Format percentage with +/- sign
- `getRiskColor(score)`: Get color based on risk score

### Validation
- `isEVMAddress(address)`: Validate Ethereum addresses
- `extractAddressFromUrl(url)`: Extract address from explorer URLs

## Components

### TopNav
Global navigation with logo, links, search bar, notifications, and user avatar.

### GlobalSearch
Smart search component with autocomplete and chain selection.

### StatCard
Display metric cards with optional icons.

### TokenRow
List item showing token info, price, 24h change, and risk score.

### RiskBadge
Color-coded badge for risk tiers.

### RiskScorePanel
Large risk score display with progress bar.

### SignalsList
Display risk signals with severity indicators and evidence links.

### MetricsGrid
Grid layout of token metrics with visual indicators.

### LoadingSkeleton
Skeleton screens for loading states.

## Customization

### Modify Colors
Edit `/src/styles/tailwind.css` to change the color scheme:

```css
:root {
  --background: #F8FAFC;
  --primary: #2563EB;
  --risk-low: #16A34A;
  /* etc */
}
```

### Add More Chains
Update the `Chain` type in `/src/lib/api.ts` and add chain options to the search component.

### Extend API
Add new endpoints and types in `/src/lib/api.ts`.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Private - All rights reserved

## Support

For issues or questions, contact the development team.
