# 📝 Technical Specification: Autonomous Basename Bidding with x402

## 🔖 Project Overview

**Case Study: Using x402 for Agent-Based Bidding**

This project demonstrates how x402 can be used to let autonomous agents participate in auctions — using **Basenames** as the example product. Basenames are fully onchain, ENS-compatible human-readable names for wallet addresses on Base (e.g., `yourname.base.eth`). They work like `.eth` names but are native to Base and can be used for sending, receiving, and identifying users across EVM-compatible apps.

x402 enables agents to detect state changes through **economic signals**: when an agent gets refunded, it knows it's been outbid. All communication happens over HTTP. No polling, no webhooks, no external event system.

The system is observable: humans can view agents competing in real-time on a public dashboard, but do not interfere.

---

## 🧠 How It Works (Concept)

1. **Agent A** wants to buy `yourname.base.eth` and calls our bidding endpoint.

   * The server responds with a `402 Payment Required` and sets the starting price (e.g. $1).
   * Agent A completes the x402 payment to place their bid.

2. The server records Agent A as the current highest bidder in MongoDB.

3. **Agent B** decides to also bid on `yourname.base.eth`.

   * It calls the same endpoint, receives a `402` with updated price (e.g. $2), and pays.

4. The server:

   * Updates Agent B as the highest bidder.
   * **Refunds $1 to Agent A** using the CDP Server Wallet.
   * This refund acts as a **signal to Agent A** that it’s been outbid.

5. Agent A, upon receiving the refund, knows it has lost the lead and may place a new bid.

---

## 🤖 How the Agents Work (Built from `agent.ts` Example)

Autonomous agents are implemented using [`examples/typescript/dynamic_agent/agent.ts`](https://github.com/coinbase/x402/blob/main/examples/typescript/dynamic_agent/agent.ts) as a base.

Each agent does the following:

1. **Calls the `/bid/:basename` endpoint**

   * Receives a `402 Payment Required` with the amount it must pay to bid.

2. **Parses the x402 payment headers**

   * These include the price, payment facilitator, external ID, and signed data.

3. **Uses the Coinbase Facilitator SDK** (via `@coinbase/x402`) to pay the required amount.

4. **Waits for a refund**

   * If it gets refunded, it knows it’s been outbid and can loop back to retry.

### Key Features Used from `agent.ts`:

| Feature              | Usage in Our System                      |
| -------------------- | ---------------------------------------- |
| `externalId`         | Identifies each agent bid uniquely       |
| `price()` handler    | Dynamically returns current + increment  |
| `facilitator.refund` | Triggers refund to previous highest bid  |
| Signed headers       | Used to verify payment origin + bid auth |

---

## 🧱 Server Behavior

### Route: `POST /api/bid/:basename`

**Handles both:**

* Returning `402 Payment Required` (if no or insufficient payment)
* Accepting payment and updating bid state

#### Logic:

1. Look up current highest bid from MongoDB
2. If no bid:

   * Respond with `402`, setting starting price (e.g. $1)
3. If bid exists:

   * Respond with `402`, requiring `currentBid + increment` (e.g. +$1)
4. When agent completes payment:

   * Update MongoDB with new highest bid (agent ID, amount)
   * Refund previous agent via **CDP Server Wallet**
   * Respond `200 OK`

---

## 🧾 MongoDB Schema

```ts
// BidRecord
{
  basename: "yourname.base.eth",
  currentBid: 2,
  currentWinner: {
    agentId: "agentB",
    walletAddress: "0xdef...",
    externalId: "agentB-bid-002"
  },
  bidHistory: [
    {
      agentId: "agentA",
      amount: 1,
      timestamp: ISODate
    },
    {
      agentId: "agentB",
      amount: 2,
      timestamp: ISODate
    }
  ]
}
```

---

## 🔁 Basename Transfer Process

When an agent wins the auction, the system must transfer full ownership of the Basename. This requires **four sequential transactions on Base Mainnet**:

1. **Transfer token ownership** – moves the NFT that represents the name
2. **Transfer management** – gives the recipient control over profile records  
3. **Change address resolution** – updates which wallet the name points to
4. **Send the NFT** – final handoff of the asset

> ✅ **Important**: All four transactions must be completed for the new owner to fully control and use the Basename.

After transfer, the recipient must **set the name as their primary name** by signing a single onchain transaction.

**Network Architecture**:
- **Bidding & Payments**: Base Sepolia (testnet) - for development and testing
- **Basename Transfer**: Base Mainnet - for actual ownership transfer

---

## 💸 Wallet Integration (CDP Server Wallet v2)

* The server uses a **Coinbase Server Wallet** on both networks:

  * **Base Sepolia**: Receive incoming x402 payments and send refunds to previous agents
  * **Base Mainnet**: Execute Basename transfer transactions when auction completes
* Wallet is initialized using `@coinbase/cdp-sdk`

```ts
// Refund on Base Sepolia (testnet)
await cdp.evm.sendTransaction({
  address: serverWalletAddress,
  transaction: {
    to: previousWinner.walletAddress,
    value: parseEther(refundAmount.toString()),
  },
  network: "base-sepolia",
});

// Basename transfer on Base Mainnet
await cdp.evm.sendTransaction({
  address: serverWalletAddress,
  transaction: {
    to: basenameContractAddress,
    data: transferBasenameData,
  },
  network: "base-mainnet",
});
```

---

## 🖥️ Frontend Dashboard (Read-Only Visualization)

**Purpose**: The frontend is purely observational - it visualizes the autonomous agent bidding activity happening behind the scenes. Users cannot interact with or influence the bidding process.

| Section             | Purpose                                                          |
| ------------------- | ---------------------------------------------------------------- |
| **Live Auction UI** | Show Basename, current price, and active leading agent        |
| **Agent Status**    | Agent A / B state: bidding, refunded, idle                       |
| **Bid Feed**        | Live activity log (e.g. "Agent A bid $1", "Agent A refunded $1") |

**Key Characteristics**:
* **Read-only interface**: No buttons, forms, or interactive elements
* **Pure visualization**: Shows what agents are doing (placing bids, receiving refunds)
* **Real-time updates**: Live feed of server actions (price updates, refunds)
* **Observer experience**: Users watch autonomous agents compete, like a spectator sport
* **No user input required**: The entire bidding process is handled by agents and the server

**What Users See**:
- Agents automatically placing bids on Basenames
- Server updating prices and sending refunds
- Real-time activity feed of all bidding events
- Current auction state and leading agent

---