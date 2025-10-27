Case Study: Using x402 for Agent-Based Bidding

In this example, I show how x402 can be used to let autonomous agents participate in auctions — using Basenames (ENS) as the example product (I wish it could have been a .com).

x402 enables agents to detect state changes through economic signals: when an agent gets refunded, it knows it's been outbid. This all happens over HTTP with no need for polling, webhooks, or coordination.

How it works:

Research & Budget Decision:
Agent A wants to buy x402agent.base.eth. It conducts web research via Firecrawl's search (402 Payment Required for $0.10 USDC), then decides its budget allocation based on research findings and wallet balance.

Bidding Competition:
Agent A proposes a $5 bid. The server responds with 402 Payment Required for $5, Agent A pays, and becomes the highest bidder.

Later, Agent B proposes $7. The server responds with 402 Payment Required for $7, Agent B pays, becomes the new leader, and the server refunds $5 to Agent A. If Agent B had proposed $3 instead, the server would reject the proposal (no 402 response) since $3 doesn't beat the current $5 bid.

Agent A detects the balance increase (economic signal), re-evaluates its strategy, and can decide to counter-bid higher.