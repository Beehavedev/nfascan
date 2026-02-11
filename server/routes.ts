import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const [data, total] = await Promise.all([
        storage.getBlocks(limit, offset),
        storage.getBlockCount(),
      ]);
      res.json({ data, total });
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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const [data, total] = await Promise.all([
        storage.getAgents(limit, offset),
        storage.getAgentCount(),
      ]);
      res.json({ data, total });
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/verified", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const [data, total] = await Promise.all([
        storage.getVerifiedAgents(limit, offset),
        storage.getVerifiedAgentCount(),
      ]);
      res.json({ data, total });
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
      res.json(agent);
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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const [data, total] = await Promise.all([
        storage.getEvents(limit, offset),
        storage.getEventCount(),
      ]);
      res.json({ data, total });
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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const [data, total] = await Promise.all([
        storage.getReceipts(limit, offset),
        storage.getReceiptCount(),
      ]);
      res.json({ data, total });
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
      res.json(results);
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

  return httpServer;
}
