import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getLatestBlockNumber } from "./bscscan";

function calculateTrustScore(agent: { verified: boolean; erc8004Id: string | null; agentType: string; learningRoot: string | null; learningModel: string | null; chainSupport: string[] | null; }): number {
  let score = 0;
  if (agent.verified) score += 30;
  if (agent.erc8004Id) score += 25;
  if (agent.agentType === "merkle_learning") score += 20;
  if (agent.learningRoot) score += 10;
  if (agent.learningModel) score += 10;
  if (agent.chainSupport && agent.chainSupport.length > 0) score += 5;
  return score;
}

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function decodeCursor(cursor?: string): number | undefined {
  if (!cursor) return undefined;
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");
    const offset = parseInt(decoded, 10);
    if (!Number.isFinite(offset) || offset < 0) return undefined;
    return offset;
  } catch {
    return undefined;
  }
}

function encodeCursor(offset: number): string {
  return Buffer.from(offset.toString(), "utf8").toString("base64");
}

function getPaging(req: any, fallbackLimit = 25) {
  const limit = Math.min(parsePositiveInt(req.query.limit) ?? fallbackLimit, 100);
  const cursorOffset = decodeCursor(req.query.cursor as string | undefined);
  const offset = cursorOffset ?? parsePositiveInt(req.query.offset) ?? 0;
  return { limit, offset };
}

function mapVerificationScope(agent: any) {
  if (agent.erc8004Id) return "erc8004_registry";
  if (agent.verified) return "source_verified";
  return "unverified";
}

function withVerificationScope<T extends { verified: boolean; erc8004Id: string | null }>(agent: T) {
  return {
    ...agent,
    verificationScope: mapVerificationScope(agent),
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/blocks", async (req, res) => {
    try {
      const { limit, offset } = getPaging(req);
      const [data, total] = await Promise.all([
        storage.getBlocks(limit, offset),
        storage.getBlockCount(),
      ]);
      const nextOffset = offset + data.length;
      res.json({
        data,
        total,
        nextCursor: nextOffset < total ? encodeCursor(nextOffset) : null,
      });
    } catch (error) {
      console.error("Error fetching blocks:", error);
      res.status(500).json({ message: "Failed to fetch blocks" });
    }
  });

  app.get("/api/blocks/:blockNumber", async (req, res) => {
    try {
      const blockNumber = parseInt(req.params.blockNumber);
      const block = await storage.getBlockByNumber(blockNumber);
      if (!block) {
        return res.status(404).json({ message: "Block not found" });
      }
      res.json(block);
    } catch (error) {
      console.error("Error fetching block:", error);
      res.status(500).json({ message: "Failed to fetch block" });
    }
  });

  app.get("/api/blocks/:blockNumber/events", async (req, res) => {
    try {
      const blockNumber = parseInt(req.params.blockNumber);
      const blockEvents = await storage.getEventsByBlockNumber(blockNumber);
      res.json(blockEvents);
    } catch (error) {
      console.error("Error fetching block events:", error);
      res.status(500).json({ message: "Failed to fetch block events" });
    }
  });

  app.get("/api/agents", async (req, res) => {
    try {
      const { limit, offset } = getPaging(req);
      const [data, total] = await Promise.all([
        storage.getAgents(limit, offset),
        storage.getAgentCount(),
      ]);
      const nextOffset = offset + data.length;
      res.json({
        data: data.map(withVerificationScope),
        total,
        nextCursor: nextOffset < total ? encodeCursor(nextOffset) : null,
      });
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/verified", async (req, res) => {
    try {
      const { limit, offset } = getPaging(req);
      const [data, total] = await Promise.all([
        storage.getVerifiedAgents(limit, offset),
        storage.getVerifiedAgentCount(),
      ]);
      const nextOffset = offset + data.length;
      res.json({
        data: data.map(withVerificationScope),
        total,
        nextCursor: nextOffset < total ? encodeCursor(nextOffset) : null,
      });
    } catch (error) {
      console.error("Error fetching verified agents:", error);
      res.status(500).json({ message: "Failed to fetch verified agents" });
    }
  });

  app.get("/api/agents/top", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const data = await storage.getTopAgents(limit);
      res.json(data);
    } catch (error) {
      console.error("Error fetching top agents:", error);
      res.status(500).json({ message: "Failed to fetch top agents" });
    }
  });

  app.get("/api/agents/operations", async (_req, res) => {
    try {
      const ops = await storage.getAgentOperationStats();
      res.json(ops);
    } catch (error) {
      console.error("Error fetching agent operations:", error);
      res.status(500).json({ message: "Failed to fetch agent operations" });
    }
  });

  app.get("/api/agents/:address", async (req, res) => {
    try {
      const agent = await storage.getAgentByAddress(req.params.address);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(withVerificationScope(agent));
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  app.get("/api/agents/:address/events", async (req, res) => {
    try {
      const agent = await storage.getAgentByAddress(req.params.address);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      const data = await storage.getEventsByAgentId(agent.id);
      res.json(data);
    } catch (error) {
      console.error("Error fetching agent events:", error);
      res.status(500).json({ message: "Failed to fetch agent events" });
    }
  });

  app.get("/api/agents/:address/permissions", async (req, res) => {
    try {
      const agent = await storage.getAgentByAddress(req.params.address);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      const perms = await storage.getPermissionsByAgentId(agent.id);
      res.json(perms);
    } catch (error) {
      console.error("Error fetching agent permissions:", error);
      res.status(500).json({ message: "Failed to fetch agent permissions" });
    }
  });

  app.get("/api/agents/:address/snapshots", async (req, res) => {
    try {
      const agent = await storage.getAgentByAddress(req.params.address);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      const snaps = await storage.getSnapshotsByAgentId(agent.id);
      res.json(snaps);
    } catch (error) {
      console.error("Error fetching agent snapshots:", error);
      res.status(500).json({ message: "Failed to fetch agent snapshots" });
    }
  });

  app.get("/api/agents/:address/receipts", async (req, res) => {
    try {
      const agent = await storage.getAgentByAddress(req.params.address);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      const recs = await storage.getReceiptsByAgentId(agent.id);
      res.json(recs);
    } catch (error) {
      console.error("Error fetching agent receipts:", error);
      res.status(500).json({ message: "Failed to fetch agent receipts" });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const { limit, offset } = getPaging(req);
      const [data, total] = await Promise.all([
        storage.getEvents(limit, offset),
        storage.getEventCount(),
      ]);
      const nextOffset = offset + data.length;
      res.json({
        data,
        total,
        nextCursor: nextOffset < total ? encodeCursor(nextOffset) : null,
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/tx/:txHash", async (req, res) => {
    try {
      const event = await storage.getEventByTxHash(req.params.txHash);
      if (!event) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  app.get("/api/receipts", async (req, res) => {
    try {
      const { limit, offset } = getPaging(req);
      const [data, total] = await Promise.all([
        storage.getReceipts(limit, offset),
        storage.getReceiptCount(),
      ]);
      const nextOffset = offset + data.length;
      res.json({
        data,
        total,
        nextCursor: nextOffset < total ? encodeCursor(nextOffset) : null,
      });
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.get("/api/bap578/stats", async (req, res) => {
    try {
      const stats = await storage.getBap578Stats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching BAP-578 stats:", error);
      res.status(500).json({ message: "Failed to fetch BAP-578 stats" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      const results = await storage.searchAgents(query);
      res.json(results.map(withVerificationScope));
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/sync/status", async (_req, res) => {
    try {
      const state = await storage.getSyncState();
      const stats = await storage.getStats();
      res.json({
        lastSyncedBlock: state?.lastSyncedBlock ?? 0,
        lastSyncAt: state?.lastSyncTime ?? null,
        totalAgents: stats.totalAgents,
        totalEvents: stats.totalEvents,
        totalBlocks: stats.totalBlocks,
        network: "BNB Smart Chain Mainnet",
        source: state?.isLive ? "live" : "none",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get sync status" });
    }
  });

  app.get("/api/health/index", async (_req, res) => {
    try {
      const [state, stats, chainHead] = await Promise.all([
        storage.getSyncState(),
        storage.getStats(),
        getLatestBlockNumber(),
      ]);
      const lagBlocks = Math.max(0, chainHead - (state?.lastSyncedBlock ?? 0));
      res.json({
        ok: true,
        chainHead,
        lastSyncedBlock: state?.lastSyncedBlock ?? 0,
        latestIndexedBlock: stats.latestBlock,
        lagBlocks,
        isLive: state?.isLive ?? false,
        lastSyncTime: state?.lastSyncTime ?? null,
        totals: stats,
      });
    } catch (error) {
      res.status(500).json({ ok: false, message: "Failed to fetch index health" });
    }
  });

  app.get("/api/agents/:address/trust", async (req, res) => {
    try {
      const agent = await storage.getAgentByAddress(req.params.address);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const agentEvents = await storage.getEventsByAgentId(agent.id);
      const evidenceTx = agentEvents.slice(0, 20).map((event) => ({
        txHash: event.txHash,
        method: event.method,
        blockNumber: event.blockNumber,
        url: `/tx/${event.txHash}`,
      }));

      const signals = [
        {
          key: "verified_source",
          label: "Verified source code",
          points: 30,
          awarded: agent.verified,
        },
        {
          key: "erc8004_registration",
          label: "ERC-8004 registration",
          points: 25,
          awarded: !!agent.erc8004Id,
        },
        {
          key: "merkle_learning_type",
          label: "Merkle learning agent type",
          points: 20,
          awarded: agent.agentType === "merkle_learning",
        },
        {
          key: "learning_root_set",
          label: "Learning root set",
          points: 10,
          awarded: !!agent.learningRoot,
        },
        {
          key: "learning_model_defined",
          label: "Learning model defined",
          points: 10,
          awarded: !!agent.learningModel,
        },
        {
          key: "cross_chain_support",
          label: "Cross-chain support",
          points: 5,
          awarded: !!agent.chainSupport && agent.chainSupport.length > 0,
        },
      ].map((signal) => ({
        ...signal,
        earnedPoints: signal.awarded ? signal.points : 0,
      }));

      res.json({
        agent: withVerificationScope(agent),
        trustScore: calculateTrustScore(agent),
        signals,
        evidence: {
          txs: evidenceTx,
        },
      });
    } catch (error) {
      console.error("Error fetching trust explainability:", error);
      res.status(500).json({ message: "Failed to fetch trust explainability" });
    }
  });

  return httpServer;
}
