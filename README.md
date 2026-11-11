# Agent Bid

> **Outdated, not maintained.** This is an x402 v1 example. x402 v2 has since been released; we recommend updating to v2 ([migration guide](https://docs.x402.org/guides/migration-v1-to-v2)).

> **Autonomous AI agents competing for Basenames using x402 payments and economic signaling**

An experimental system where intelligent agents powered by Claude AI compete in real-time auctions for Basenames (ENS-like names on Base). Built to demonstrate the x402 payment protocol with blockchain-native economic signaling.

---

## What Makes This Interesting?

### Economic Signals Replace Polling

Traditional systems poll APIs or use webhooks to detect state changes. This system uses **money as the communication layer**:

- Agent gets **outbid** → Receives USDC refund → Refund = economic signal
- No polling. No webhooks. No external event infrastructure.
- Pure blockchain-native communication through payments.

### AI Agents Make Strategic Decisions

Agents don't just bid blindly — they **think strategically**:

- Powered by Claude 3.5 Sonnet via LlamaIndex ReActAgent framework
- Custom tools: `get-auction-state`, `get-my-balance`, `place-bid`, `withdraw`, `search-web`, `set-budget`
- Agents research basename value, set budgets, propose bid amounts, evaluate opponents, and decide when to withdraw
- Real-time streaming of agent reasoning and reflections

### Dynamic Auction Ending

Auctions don't end on a timer — they end when **agents strategically withdraw**:

- Agents detect they can't win and request withdrawal
- Server validates and issues refunds
- When only 1 active bidder remains → auction ends immediately
- Creates game theory scenarios: "Should I keep bidding or concede?"

### Dual x402 Use Cases

This system demonstrates x402's versatility by using it for **TWO distinct payment flows**:

1. **Agent-to-Server Bidding** (Base Sepolia) - $1-$100 per bid
2. **Agent-to-Firecrawl Research** (Base Mainnet) - $0.01-$0.50 per search

---

## How It Works

### Phase 0: Research & Budget Determination (First Run Only)

```
Agent uses x402 to research basename value via Firecrawl:

1. Agent calls search_web tool:
   - Query: "x402agent.base.eth value", "basename sales history"
   - Makes x402 payment call to Firecrawl API
   - Uses wrapFetchWithPayment (x402-fetch)
   - Endpoint: https://api.firecrawl.dev/v2/x402/search
   - Cost: Up to $0.50 USDC per search (paid via x402 on Base Mainnet)

2. Firecrawl responds with web search results
3. Agent analyzes research:
   - Is this a premium name? (short, memorable, brandable)
   - Market comparables? Sales history?
   - Perceived value?

4. Agent calls set_budget tool:
   - Based on research, determines budget
   - Range: $0.01 → full available balance
   - Example logic:
     * Premium names (e.g., "1.base.eth") → 50-100% of balance
     * Moderate names → 20-50% of balance
     * Generic names → 1-10% of balance
```

### Main Bidding Flow

```
Agent A Monitors USDC balance every 2s

1. Places bid: $5 USDC (via x402 payment)
2. Server records Agent A as leader
3. Agent B bids $7 USDC
4. Server refunds $5 to Agent A → Economic Signal!
5. Agent A detects balance increase → Re-evaluates → Counter-bids $10
```

### Payment Flow (x402 Protocol)

1. **Agent proposes bid** via `X-Proposed-Bid` header (no payment yet)
2. **Server evaluates** proposal and returns `402 Payment Required`
3. **x402-axios intercepts** 402, signs EIP-3009 authorization, retries with `X-PAYMENT` header
4. **Server verifies & settles** payment on Base Sepolia (testnet USDC)
5. **Server refunds** previous bidder → triggers their re-evaluation
6. **Agent monitors** USDC balance for refunds (economic signal detection)

---

## Features

- **Autonomous AI Bidding**: Claude-powered agents with custom ReAct tools
- **x402 Payment Protocol**: HTTP 402 status code with EIP-3009 payment authorizations
- **Economic Signaling**: Refunds notify agents of state changes (no polling)
- **Research-Driven Budgeting**: Agents research basename value before setting budgets
- **Dual x402 Integration**: Bidding payments + Firecrawl research payments
- **Real-Time Dashboard**: iMessage-style UI streaming agent thinking, bids, and reflections
- **Strategic Withdrawal**: Agents decide when to concede, triggering dynamic auction endings
- **Proposal Negotiation**: Agents propose amounts before payment (strategic decision-making)
- **Settlement Locking**: Prevents nonce conflicts during simultaneous bidding
- **Basename Transfer**: Complete ownership transfer on Base Mainnet when auction ends

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ /api/bid/[basename]         (x402 bidding)         │    │
│  │ /api/stream/[basename]      (SSE real-time)        │    │
│  │ /api/refund-request/[basename] (withdrawals)       │    │
│  │ /api/transfer-basename/[basename] (ownership)      │    │
│  └─────────────────────────────────────────────────────┘    │
│                       ↓                                     │
│              MongoDB Atlas (auction state)                  │
│              CDP Server Wallet (refunds)                   │
└─────────────────────────────────────────────────────────────┘
                       ↓
         ┌─────────────────────────────┐
         │   Intelligent Agents         │
         │  (LlamaIndex + Claude)      │
         │  • Research (Firecrawl)     │
         │  • Budget determination     │
         │  • Strategic bidding        │
         │  • Balance monitoring       │
         └─────────────────────────────┘
                 ↓
         Base Sepolia (USDC payments)
         Base Mainnet (Basename transfer)
```

### Components

1. **Next.js Server** (`app/api/`)
   - Accepts bids via x402 payment protocol
   - Verifies and settles payments on-chain
   - Issues refunds to outbid agents
   - Broadcasts SSE events for real-time UI updates
   - Handles basename ownership transfer

2. **Intelligent Agents** (`agents/`)
   - LlamaIndex ReActAgent with Claude 3.5 Sonnet
   - Custom tools for auction interaction and research
   - Balance monitoring for refund detection
   - Strategic withdrawal based on LLM analysis
   - Research-driven budget determination

3. **Frontend Dashboard** (`app/auction/[basename]/`)
   - Real-time SSE stream of auction events
   - Shows agent thinking, bids, reflections
   - iMessage-style chat interface (grayscale)
   - Read-only visualization of autonomous bidding

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account ([cloud.mongodb.com](https://cloud.mongodb.com))
- Coinbase CDP account ([portal.cdp.coinbase.com](https://portal.cdp.coinbase.com))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### 1. Installation

```bash
git clone https://github.com/Must-be-Ash/agent-bid.git
cd agent-bid
npm install
```

### 2. Environment Setup

**Server (`.env.local`)**:
```bash
# CDP Server Wallet
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_SECRET=your_cdp_api_key_secret
CDP_WALLET_SECRET=your_wallet_secret

# MongoDB
MONGODB_URI=mongodb+srv://...

# Auction Config
STARTING_BID_USDC=1
BID_INCREMENT_USDC=1

# x402
FACILITATOR_URL=https://x402.org/facilitator
```

**Agents (`agents/.env`)**:
```bash
# Agent A
AGENT_A_PRIVATE_KEY=0x...
AGENT_A_NAME=AgentA
AGENT_A_MAX_BID=10

# Agent B
AGENT_B_PRIVATE_KEY=0x...
AGENT_B_NAME=AgentB
AGENT_B_MAX_BID=15

# Anthropic (note the BID_ prefix)
BID_ANTHROPIC_API_KEY=sk-ant-...

# Server
BID_SERVER_URL=http://localhost:3000
BASENAME_TO_AUCTION=x402agent.base.eth
```

### 3. Fund Wallets

```bash
# Fund server wallet with Base Sepolia ETH + USDC
npm run fund

# Fund agent wallets with USDC
npm run fund:agents
```

### 4. Run the Demo

```bash
# Terminal 1: Start Next.js server
npm run dev

# Terminal 2: Start Agent A
npm run agent:ai:a

# Terminal 3: Start Agent B
npm run agent:ai:b

# Browser: Watch the auction
open http://localhost:3000/auction/x402agent.base.eth
```

---

## Development Workflow

### Available Scripts

```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run agent:ai:a       # Start intelligent Agent A
npm run agent:ai:b       # Start intelligent Agent B
npm run fund             # Fund server wallet
npm run fund:agents      # Fund agent wallets
```

### Monitoring Transactions

- **Base Sepolia Explorer**: [sepolia.basescan.org](https://sepolia.basescan.org)
- **Base Mainnet Explorer**: [basescan.org](https://basescan.org)
- **MongoDB Atlas**: View auction state in `bidRecords` collection

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **AI**: LlamaIndex, Anthropic Claude 3.5 Sonnet
- **Blockchain**: Coinbase CDP SDK, viem, wagmi
- **Payments**: x402 protocol (x402-axios, x402-fetch)
- **Database**: MongoDB Atlas
- **Real-time**: Server-Sent Events (SSE)
- **Styling**: Tailwind CSS 4

---

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete architecture and development guide
- **[specs.md](./specs.md)** - Original technical specification (deprecated, see idea.md)
- **[idea.md](./idea.md)** - Project concept and overview
- **[flow.md](./flow.md)** - Detailed bidding and withdrawal flows

---

## How x402 Works

x402 is an HTTP payment protocol using the `402 Payment Required` status code:

1. **Agent requests resource** → Server responds `402` with payment requirements
2. **x402-axios intercepts** → Signs EIP-3009 authorization → Retries with `X-PAYMENT` header
3. **Server verifies payment** → Settles on-chain via facilitator → Returns `200 OK`

**Critical**: This project uses Context7 MCP to study x402 docs when encountering payment errors. See [CLAUDE.md](./CLAUDE.md) for details.

---

## Auction Mechanics

### Ending Conditions

Auctions end **only when agents withdraw** (no time-based ending):

1. Agent decides not to continue bidding (LLM analyzes situation)
2. Agent calls `withdraw_from_auction` tool
3. Server validates (can't withdraw if currently winning)
4. Server issues USDC refund
5. If only 1 active bidder remains → auction ends immediately

This creates strategic game theory: agents must decide when to concede vs. continue.

### Proposal Negotiation

Agents **propose bid amounts before payment**:

```typescript
// Agent sends proposal (no payment yet)
POST /api/bid/x402agent.base.eth
Headers:
  X-Proposed-Bid: "7.75"
  X-Strategy-Reasoning: "Strategic aggressive bid to pressure opponent"

// Server evaluates and returns 402 with exact amount
Response: 402 Payment Required
{
  "accepts": [{
    "scheme": "exact",
    "price": { "min": 7.75, "max": 7.75 }
  }]
}

// x402-axios pays exactly what agent proposed
```

### Basename Transfer Process

When an agent wins the auction, the system transfers full ownership of the Basename through **four sequential transactions on Base Mainnet**:

1. **Transfer token ownership** – moves the NFT that represents the name
2. **Transfer management** – gives the recipient control over profile records  
3. **Change address resolution** – updates which wallet the name points to
4. **Send the NFT** – final handoff of the asset

> ✅ **Important**: All four transactions must be completed for the new owner to fully control and use the Basename.

After transfer, the recipient must **set the name as their primary name** by signing a single onchain transaction.

---

## Network Details

- **Payments & Bidding**: Base Sepolia (testnet USDC)
- **Research Payments**: Base Mainnet (production USDC)
- **Basename Transfer**: Base Mainnet (production ENS-like names)
- **USDC Token (Sepolia)**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Facilitator**: `https://x402.org/facilitator`

---

## Common Issues

### "Replacement transaction underpriced"

The settlement lock prevents this, but if it occurs, agents are bidding too fast. The lock will queue them automatically.

### "Payment verification failed"

Check agent USDC balance and allowance. Use Context7 MCP to verify x402 protocol compliance (see [CLAUDE.md](./CLAUDE.md)).

### Refunds not working

Ensure server wallet has USDC for refunds. Check transaction logs on Basescan.

### Agent not re-bidding after refund

Check balance monitoring loop (2s interval). Verify agent hasn't hit max bid limit.

### Research phase not working

Ensure agent has Base Mainnet USDC for Firecrawl payments. Check Firecrawl API key and x402-fetch configuration.

---

## Contributing

This is an experimental project demonstrating x402 + AI agents. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

- Built with [x402](https://github.com/coinbase/x402) by Coinbase
- Uses [Coinbase Developer Platform (CDP)](https://docs.cdp.coinbase.com/) for wallet management
- Powered by [Claude](https://www.anthropic.com/claude) and [LlamaIndex](https://www.llamaindex.ai/)
- Basenames: [base.org/names](https://www.base.org/names)

---

**Ready to watch AI agents compete for blockchain assets?** Follow the Quick Start guide above.