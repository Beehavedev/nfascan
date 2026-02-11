import { db } from "./db";
import { blocks, agents, events, permissions, snapshots, receipts } from "@shared/schema";
import { count } from "drizzle-orm";

function randomHex(bytes: number): string {
  const chars = "0123456789abcdef";
  let result = "0x";
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

function pastDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

export async function seedDatabase() {
  const [existing] = await db.select({ count: count() }).from(agents);
  if (existing.count > 0) return;

  console.log("Seeding database with comprehensive NFA data...");

  const blockData: Array<{
    blockNumber: number;
    hash: string;
    parentHash: string | null;
    agentCount: number;
    eventCount: number;
    gasUsed: string;
    gasLimit: string;
    validator: string;
    timestamp: Date;
  }> = [];

  let prevHash: string | null = null;
  for (let i = 0; i < 50; i++) {
    const bn = 19000000 + i * 127;
    const hash = randomHex(32);
    blockData.push({
      blockNumber: bn,
      hash,
      parentHash: prevHash,
      agentCount: Math.floor(Math.random() * 5),
      eventCount: 2 + Math.floor(Math.random() * 8),
      gasUsed: `${(5000000 + Math.floor(Math.random() * 10000000)).toLocaleString()}`,
      gasLimit: "30,000,000",
      validator: randomHex(20),
      timestamp: pastDate(50 - i),
    });
    prevHash = hash;
  }

  for (const b of blockData) {
    await db.insert(blocks).values(b);
  }

  const agentData = [
    {
      address: "0x7a3b1c9d4e5f6a8b2c0d1e3f5a7b9c1d3e5f7a9b",
      name: "Sentinel-v3",
      description: "Autonomous security monitoring agent specializing in DeFi protocol risk assessment and real-time threat detection across L1/L2 chains.",
      owner: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
      status: "active",
      version: "3.2.1",
      logicAddress: "0xab12cd34ef56ab78cd90ef12ab34cd56ef78ab90",
      metadataUri: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      learningRoot: "0xdef0123456789abcdef0123456789abcdef01234",
      compiler: "NFA-Compiler v2.3.0",
      license: "MIT",
      verified: true,
      totalEvents: 24,
      totalReceipts: 12,
      balance: "14.2847 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_001_sentinel_v3_identity_registry_0001",
      learningModel: "reinforcement",
      chainSupport: ["bsc_mainnet", "ethereum", "arbitrum"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0x2f8c1d5e6a9b3c7d4e0f1a2b5c8d9e3f6a7b0c1d",
      name: "Orchestrator-Alpha",
      description: "Multi-chain workflow orchestrator that coordinates cross-protocol operations, manages gas optimization, and handles MEV protection.",
      owner: "0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d",
      status: "active",
      version: "2.0.4",
      logicAddress: "0x1234567890abcdef1234567890abcdef12345678",
      metadataUri: "ipfs://QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX",
      learningRoot: "0xabc123def456abc789def012abc345def678abc9",
      compiler: "NFA-Compiler v2.1.0",
      license: "Apache-2.0",
      verified: true,
      totalEvents: 18,
      totalReceipts: 9,
      balance: "8.5120 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_002_orchestrator_alpha_registry_0002",
      learningModel: "hybrid",
      chainSupport: ["bsc_mainnet", "optimism", "base"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0x5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c",
      name: "DataWeaver",
      description: "Decentralized data aggregation agent that crawls, validates, and serves oracle data feeds with zero-knowledge proof verification.",
      owner: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
      status: "paused",
      version: "1.5.0",
      logicAddress: "0xfedcba9876543210fedcba9876543210fedcba98",
      metadataUri: "ar://abc123def456ghi789jkl012mno345pqr678stu9",
      learningRoot: null,
      compiler: "NFA-Compiler v1.8.0",
      license: "GPL-3.0",
      verified: true,
      totalEvents: 14,
      totalReceipts: 6,
      balance: "3.0410 NFA",
      agentType: "json_light",
      erc8004Id: "0xerc8004_003_dataweaver_identity_registry_0003",
      learningModel: null,
      chainSupport: ["bsc_mainnet"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0x8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d",
      name: "NeuroTrader",
      description: "Adaptive trading agent utilizing reinforcement learning for optimal DeFi yield strategies with dynamic risk parameters.",
      owner: "0xdeadbeef12345678deadbeef12345678deadbeef",
      status: "active",
      version: "4.1.0",
      logicAddress: "0x0987654321abcdef0987654321abcdef09876543",
      metadataUri: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
      learningRoot: "0x567890abcdef1234567890abcdef12345678abcd",
      compiler: "NFA-Compiler v2.3.0",
      license: "MIT",
      verified: true,
      totalEvents: 30,
      totalReceipts: 15,
      balance: "42.9003 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_004_neurotrader_identity_registry_0004",
      learningModel: "reinforcement",
      chainSupport: ["bsc_mainnet", "ethereum", "arbitrum", "polygon"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      name: "GovernanceBot",
      description: "DAO governance assistant that analyzes proposals, simulates outcomes, and executes voted decisions across multiple governance frameworks.",
      owner: "0xc0ffee1234567890c0ffee1234567890c0ffee12",
      status: "inactive",
      version: "1.0.0",
      logicAddress: null,
      metadataUri: null,
      learningRoot: null,
      compiler: null,
      license: null,
      verified: false,
      totalEvents: 5,
      totalReceipts: 2,
      balance: "0.0500 NFA",
      agentType: "json_light",
      erc8004Id: null,
      learningModel: null,
      chainSupport: ["bsc_mainnet"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0xaa11bb22cc33dd44ee55ff66aa77bb88cc99dd00",
      name: "YieldHarvester",
      description: "Automated yield farming optimizer that rotates liquidity across AMMs, lending protocols, and structured products for maximum APY.",
      owner: "0x1111222233334444555566667777888899990000",
      status: "active",
      version: "2.3.0",
      logicAddress: "0xddee11223344556677889900aabbccddeeff0011",
      metadataUri: "ipfs://QmZbWNKJPAjxXuNFSEFnkCAjU4gHpSYRsn99vJjb6EeD1c",
      learningRoot: "0x1122334455667788990011aabbccddeeff001122",
      compiler: "NFA-Compiler v2.2.0",
      license: "MIT",
      verified: true,
      totalEvents: 22,
      totalReceipts: 11,
      balance: "156.3200 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_006_yieldharvester_registry_0006",
      learningModel: "fine_tuning",
      chainSupport: ["bsc_mainnet", "ethereum"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0xbb22cc33dd44ee55ff6600aa11bb22cc33dd44ee",
      name: "AuditGuard",
      description: "Smart contract auditing agent that performs static analysis, formal verification, and vulnerability scanning with zero false positives.",
      owner: "0x2222333344445555666677778888999900001111",
      status: "active",
      version: "1.8.2",
      logicAddress: "0x223344556677889900aabbccddeeff0011223344",
      metadataUri: "ipfs://QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u",
      learningRoot: "0x3344556677889900aabbccddeeff001122334455",
      compiler: "NFA-Compiler v2.0.0",
      license: "Apache-2.0",
      verified: true,
      totalEvents: 16,
      totalReceipts: 8,
      balance: "7.8900 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_007_auditguard_identity_registry_0007",
      learningModel: "rag",
      chainSupport: ["bsc_mainnet", "ethereum", "polygon"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0xcc33dd44ee55ff6600aa11bb22cc33dd44ee55ff",
      name: "LiquidityRouter",
      description: "Cross-DEX liquidity routing engine that finds optimal swap paths across 50+ decentralized exchanges and aggregators.",
      owner: "0x3333444455556666777788889999000011112222",
      status: "active",
      version: "3.0.1",
      logicAddress: "0x44556677889900aabbccddeeff00112233445566",
      metadataUri: "ipfs://QmR7GSQM93Cx5eAg6a6yRzNde1FQv7uL6X1o4k7zrJa3LX",
      learningRoot: "0x556677889900aabbccddeeff0011223344556677",
      compiler: "NFA-Compiler v2.3.0",
      license: "MIT",
      verified: true,
      totalEvents: 35,
      totalReceipts: 18,
      balance: "89.4500 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_008_liquidityrouter_registry_0008",
      learningModel: "mcp",
      chainSupport: ["bsc_mainnet", "ethereum", "arbitrum", "optimism", "base"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0xdd44ee55ff6600aa11bb22cc33dd44ee55ff6600",
      name: "BridgeKeeper",
      description: "Cross-chain bridge monitoring agent that validates bridge transactions, detects anomalies, and manages emergency shutdowns.",
      owner: "0x4444555566667777888899990000111122223333",
      status: "active",
      version: "2.1.0",
      logicAddress: "0x6677889900aabbccddeeff001122334455667788",
      metadataUri: "ar://def456ghi789jkl012mno345pqr678stu9vwx012",
      learningRoot: "0x778899aabbccddeeff00112233445566778899aa",
      compiler: "NFA-Compiler v2.1.0",
      license: "GPL-3.0",
      verified: true,
      totalEvents: 20,
      totalReceipts: 10,
      balance: "25.1200 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_009_bridgekeeper_identity_registry_0009",
      learningModel: "hybrid",
      chainSupport: ["bsc_mainnet", "ethereum", "arbitrum", "polygon", "avalanche"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0xee55ff6600aa11bb22cc33dd44ee55ff66007788",
      name: "OracleSync",
      description: "Decentralized oracle synchronization agent that aggregates price feeds from Chainlink, Band, and custom API sources.",
      owner: "0x5555666677778888999900001111222233334444",
      status: "active",
      version: "1.4.0",
      logicAddress: "0x8899aabbccddeeff00112233445566778899aabb",
      metadataUri: "ipfs://QmPHT8bG56W9Y3hE7UBNgF4jX3Qz5q9oE1dD6nP2Lk8RxV",
      learningRoot: null,
      compiler: "NFA-Compiler v1.9.0",
      license: "MIT",
      verified: true,
      totalEvents: 12,
      totalReceipts: 5,
      balance: "4.6700 NFA",
      agentType: "json_light",
      erc8004Id: "0xerc8004_010_oraclesync_identity_registry_0010",
      learningModel: null,
      chainSupport: ["bsc_mainnet", "ethereum"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0xff6600aa11bb22cc33dd44ee55ff6600aa11bb22",
      name: "ComplianceBot",
      description: "Regulatory compliance agent that monitors transactions for AML/KYC requirements and generates automated reports.",
      owner: "0x6666777788889999000011112222333344445555",
      status: "paused",
      version: "1.2.0",
      logicAddress: null,
      metadataUri: "ipfs://QmVH1LQbDh5R3UxTmUqf8kJzWb2R7nE6u4Yp3A8xMfK9Gq",
      learningRoot: null,
      compiler: null,
      license: null,
      verified: false,
      totalEvents: 8,
      totalReceipts: 3,
      balance: "1.2000 NFA",
      agentType: "json_light",
      erc8004Id: null,
      learningModel: null,
      chainSupport: ["bsc_mainnet"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0x0011223344556677889900aabbccddeeff001122",
      name: "NFTIndexer",
      description: "NFT collection indexing agent that tracks ownership, metadata changes, and market activity across ERC-721 and ERC-1155 standards.",
      owner: "0x7777888899990000111122223333444455556666",
      status: "active",
      version: "2.5.0",
      logicAddress: "0xaabbccddeeff00112233445566778899aabbccdd",
      metadataUri: "ipfs://QmX9H6K4RGb5tE3YhD2nJvF7wC8aQzLp1x4Mu6sN9oK2Ve",
      learningRoot: "0xbbccddeeff00112233445566778899aabbccdde0",
      compiler: "NFA-Compiler v2.3.0",
      license: "MIT",
      verified: true,
      totalEvents: 28,
      totalReceipts: 14,
      balance: "33.7600 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_012_nftindexer_identity_registry_0012",
      learningModel: "rag",
      chainSupport: ["bsc_mainnet", "ethereum"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0x1122334455667788990011aabbccddeeff001122",
      name: "FlashLoanGuard",
      description: "Flash loan attack detection and prevention agent that monitors mempool activity and implements circuit breakers.",
      owner: "0x8888999900001111222233334444555566667777",
      status: "active",
      version: "1.6.0",
      logicAddress: "0xccddeeff00112233445566778899aabbccddeeff",
      metadataUri: "ar://ghi789jkl012mno345pqr678stu9vwx012yza345",
      learningRoot: "0xddeeff00112233445566778899aabbccddeeff00",
      compiler: "NFA-Compiler v2.0.0",
      license: "Apache-2.0",
      verified: true,
      totalEvents: 19,
      totalReceipts: 9,
      balance: "11.5400 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_013_flashloanguard_registry_0013",
      learningModel: "reinforcement",
      chainSupport: ["bsc_mainnet", "ethereum", "arbitrum"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0x2233445566778899001122aabbccddeeff001122",
      name: "GasOptimizer",
      description: "Transaction gas optimization agent that batches operations, predicts gas prices, and routes through optimal networks.",
      owner: "0x9999000011112222333344445555666677778888",
      status: "active",
      version: "3.1.0",
      logicAddress: "0xeeff00112233445566778899aabbccddeeff0011",
      metadataUri: "ipfs://QmL4R8hU2nF3zK9vWxQjP7e1dY6mT5sCgA0bN8oJ3iG2Uq",
      learningRoot: "0xeeff001122334455667788990011aabbccddeeff",
      compiler: "NFA-Compiler v2.3.0",
      license: "MIT",
      verified: true,
      totalEvents: 32,
      totalReceipts: 16,
      balance: "67.2100 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_014_gasoptimizer_identity_registry_0014",
      learningModel: "fine_tuning",
      chainSupport: ["bsc_mainnet", "ethereum", "arbitrum", "optimism", "base", "polygon"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0x334455667788990011223344aabbccddeeff0011",
      name: "MEVShield",
      description: "MEV protection agent that detects sandwich attacks, front-running, and implements private transaction routing via Flashbots.",
      owner: "0xaaaa111122223333444455556666777788889999",
      status: "active",
      version: "2.7.0",
      logicAddress: "0xff00112233445566778899aabbccddeeff001122",
      metadataUri: "ipfs://QmN5T9iV3oG4xJ0rWkRyH6f2eZ8mS7pDhB1cL9qK4jF3Ws",
      learningRoot: "0xff001122334455667788990011aabbccddeeff00",
      compiler: "NFA-Compiler v2.2.0",
      license: "MIT",
      verified: true,
      totalEvents: 25,
      totalReceipts: 13,
      balance: "45.8300 NFA",
      agentType: "merkle_learning",
      erc8004Id: "0xerc8004_015_mevshield_identity_registry_0015",
      learningModel: "mcp",
      chainSupport: ["bsc_mainnet", "ethereum"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0x445566778899001122334455aabbccddeeff0011",
      name: "StakingManager",
      description: "Automated staking management agent that optimizes validator selection, handles reward compounding, and manages slashing protection.",
      owner: "0xbbbb222233334444555566667777888899990000",
      status: "active",
      version: "1.9.0",
      logicAddress: null,
      metadataUri: "ipfs://QmO6U0jW4pH5yK1sXlSzI8g3fA9nR8qEiC2dM0rL5kH4Xt",
      learningRoot: null,
      compiler: null,
      license: null,
      verified: false,
      totalEvents: 10,
      totalReceipts: 4,
      balance: "230.5000 NFA",
      agentType: "json_light",
      erc8004Id: null,
      learningModel: null,
      chainSupport: ["bsc_mainnet"],
      mintFee: "0.01 BNB",
    },
    {
      address: "0x556677889900112233445566aabbccddeeff0011",
      name: "PortfolioTracker",
      description: "Multi-wallet portfolio tracking agent providing real-time P&L, impermanent loss calculations, and tax reporting assistance.",
      owner: "0xcccc333344445555666677778888999900001111",
      status: "inactive",
      version: "1.1.0",
      logicAddress: null,
      metadataUri: null,
      learningRoot: null,
      compiler: null,
      license: null,
      verified: false,
      totalEvents: 4,
      totalReceipts: 1,
      balance: "0.0100 NFA",
      agentType: "json_light",
      erc8004Id: null,
      learningModel: null,
      chainSupport: ["bsc_mainnet"],
      mintFee: "0.01 BNB",
    },
  ];

  const createdAgents = [];
  for (let i = 0; i < agentData.length; i++) {
    const [a] = await db
      .insert(agents)
      .values({ ...agentData[i], createdAt: pastDate(45 - i * 2) })
      .returning();
    createdAgents.push(a);
  }

  const eventTypes = ["created", "transfer", "permission_granted", "permission_revoked", "snapshot", "logic_update", "metadata_update"];
  const methods = ["createAgent", "transferOwnership", "grantPermission", "revokePermission", "commitSnapshot", "upgradeLogic", "updateMetadata"];

  for (const agent of createdAgents) {
    const numEvents = agent.totalEvents;
    for (let i = 0; i < numEvents; i++) {
      const typeIdx = i === 0 ? 0 : Math.floor(Math.random() * eventTypes.length);
      const type = eventTypes[typeIdx];
      const block = blockData[Math.floor(Math.random() * blockData.length)];
      await db.insert(events).values({
        agentId: agent.id,
        type,
        txHash: randomHex(32),
        blockNumber: block.blockNumber,
        fromAddress: i === 0 ? "0x0000000000000000000000000000000000000000" : randomHex(20),
        toAddress: agent.address,
        value: type === "transfer" ? `${(Math.random() * 10).toFixed(4)} NFA` : null,
        gasUsed: `${21000 + Math.floor(Math.random() * 200000)}`,
        gasPrice: `${(5 + Math.random() * 50).toFixed(2)} Gwei`,
        status: Math.random() > 0.05 ? "confirmed" : "failed",
        method: methods[typeIdx],
        details: type === "transfer" ? { value: `${(Math.random() * 10).toFixed(4)} NFA` } : null,
        timestamp: pastDate(numEvents - i),
      });
    }
  }

  const permissionNames = ["execute", "read_state", "write_state", "delegate", "upgrade", "monitor", "configure"];
  const scopes = ["global", "protocol:aave", "protocol:uniswap", "protocol:compound", "chain:mainnet", "chain:arbitrum", "chain:optimism", "chain:base"];

  for (const agent of createdAgents.slice(0, 12)) {
    const numPerms = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numPerms; i++) {
      await db.insert(permissions).values({
        agentId: agent.id,
        name: permissionNames[i % permissionNames.length],
        grantedTo: randomHex(20),
        scope: scopes[Math.floor(Math.random() * scopes.length)],
        active: Math.random() > 0.2,
        grantedAt: pastDate(25 - i * 2),
      });
    }
  }

  for (const agent of createdAgents.slice(0, 10)) {
    const numSnaps = 2 + Math.floor(Math.random() * 4);
    let parentHash: string | null = null;
    for (let i = 0; i < numSnaps; i++) {
      const rootHash = randomHex(32);
      const block = blockData[Math.floor(Math.random() * blockData.length)];
      await db.insert(snapshots).values({
        agentId: agent.id,
        rootHash,
        parentHash,
        size: 1024 * (50 + Math.floor(Math.random() * 500)),
        blockNumber: block.blockNumber,
        metadata: { epoch: i + 1, accuracy: (0.85 + Math.random() * 0.14).toFixed(4) },
        createdAt: pastDate(20 - i * 2),
      });
      parentHash = rootHash;
    }
  }

  const receiptActions = ["inference", "state_commit", "delegation", "transfer", "upgrade", "stake", "unstake", "claim_reward", "batch_execute"];
  for (const agent of createdAgents.slice(0, 14)) {
    const numReceipts = agent.totalReceipts;
    for (let i = 0; i < numReceipts; i++) {
      const block = blockData[Math.floor(Math.random() * blockData.length)];
      await db.insert(receipts).values({
        agentId: agent.id,
        action: receiptActions[Math.floor(Math.random() * receiptActions.length)],
        txHash: randomHex(32),
        fromAddress: agent.address,
        toAddress: randomHex(20),
        value: Math.random() > 0.3 ? `${(Math.random() * 20).toFixed(4)} NFA` : null,
        status: Math.random() > 0.08 ? "confirmed" : Math.random() > 0.5 ? "pending" : "failed",
        blockNumber: block.blockNumber,
        gasUsed: `${(21000 + Math.floor(Math.random() * 200000)).toLocaleString()}`,
        timestamp: pastDate(15 - i),
      });
    }
  }

  console.log("Comprehensive seed data inserted successfully.");
}
