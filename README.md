# NfaScan - BAP-578 Agent Verification Explorer

A BSCScan-style blockchain explorer for verifying real AI agents built on [BAP-578](https://github.com/bnb-chain/BEPs/blob/master/BAPs/BAP-578.md) (BNB Chain's Non-Fungible Agent standard).

The core mission is filtering genuine BAP-578 compliant agents from fake ones using trust scores, ERC-8004 identity verification, and on-chain learning proof validation.

## Features

- **Live BNB Chain Data** - Real blocks, transactions, and contracts from BSC mainnet via RPC + Etherscan V2 API
- **BAP-578 Compliance Detection** - Scans contract ABIs for actual BAP-578 interface functions (executeAction, fundAgent, updateLearningTree, verifyLearning, etc.)
- **Trust Score System** - 0-100 scoring based on verified source code (+30), ERC-8004 registration (+25), Merkle learning type (+20), learning root (+10), learning model (+10), cross-chain support (+5)
- **NFA Discovery** - Sequential token ID probing of the official BAP-578 NFA contract to discover real agents
- **ERC-8004 Identity Verification** - Only agents registered in the real ERC-8004 Identity Registry get verified status
- **Agent Classification** - Dual-path architecture: Merkle Tree Learning (evolving agents) vs JSON Light Memory (static agents)

## Architecture

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (client-side)
- **Data Fetching**: @tanstack/react-query

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home with verification-focused hero, BAP-578 compliance overview, Latest Blocks + Transactions |
| `/agents` | Agent listing with Trust, Type, ERC-8004 columns and pagination |
| `/verified` | Verified BAP-578 agents with compliance details |
| `/topagents` | Top agents ranked by activity with trust indicators |
| `/events` | Transaction listing with pagination |
| `/blocks` | Block listing with pagination |
| `/block/:blockNumber` | Block detail with overview and transactions |
| `/tx/:txHash` | Transaction detail page |
| `/bap578` | Protocol overview with stats, dual-path architecture, learning models |
| `/agent/:address` | Agent detail with trust score, BAP-578 info, tabs |
| `/receipts` | Receipts listing |
| `/permissions` | Permissions overview |

## BAP-578 Reference

- **Spec**: [github.com/bnb-chain/BEPs/BAP-578.md](https://github.com/bnb-chain/BEPs/blob/master/BAPs/BAP-578.md)
- **Reference Implementation**: [github.com/ChatAndBuild/non-fungible-agents-BAP-578](https://github.com/ChatAndBuild/non-fungible-agents-BAP-578)
- **NFA Contract**: `0xf2954d349D7FF9E0d4322d750c7c2921b0445fdf`
- **ERC-8004 Identity Registry**: `0xBE6745f74DF1427a073154345040a37558059eBb`

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Installation

```bash
npm install
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BSCSCAN_API_KEY` | BSCScan/Etherscan API key for contract enrichment |
| `SESSION_SECRET` | Session secret for Express |

### Running

```bash
npm run dev
```

The application starts on port 5000 with both the Express API and Vite dev server.

### Database

Push the schema to your database:

```bash
npm run db:push
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | Global statistics |
| `GET /api/bap578/stats` | BAP-578 specific stats |
| `GET /api/blocks?limit=N&offset=N` | List blocks |
| `GET /api/blocks/:blockNumber` | Single block |
| `GET /api/agents?limit=N&offset=N` | List agents |
| `GET /api/agents/verified?limit=N&offset=N` | Verified agents |
| `GET /api/agents/top?limit=N` | Top agents by activity |
| `GET /api/agents/:address` | Single agent |
| `GET /api/events?limit=N&offset=N` | Global events |
| `GET /api/tx/:txHash` | Single transaction |
| `GET /api/receipts?limit=N&offset=N` | Global receipts |
| `GET /api/search?q=term` | Search agents |

## Trust Score System

Trust scores (0-100) are calculated per agent based on BAP-578 compliance signals:

| Signal | Points |
|--------|--------|
| Verified source code | +30 |
| ERC-8004 identity registration | +25 |
| Merkle learning agent type | +20 |
| Learning root set | +10 |
| Learning model defined | +10 |
| Cross-chain support | +5 |

**Levels**: High Trust (70+), Medium (40-69), Low Trust (<40)

## License

MIT
