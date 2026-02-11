import { db } from "./db";
import { eq, desc, ilike, or, sql, count, isNotNull, and } from "drizzle-orm";
import {
  blocks,
  agents,
  events,
  permissions,
  snapshots,
  receipts,
  syncState,
  type Block,
  type InsertBlock,
  type Agent,
  type InsertAgent,
  type AgentEvent,
  type InsertEvent,
  type Permission,
  type InsertPermission,
  type Snapshot,
  type InsertSnapshot,
  type Receipt,
  type InsertReceipt,
} from "@shared/schema";

export interface IStorage {
  getBlocks(limit?: number, offset?: number): Promise<Block[]>;
  getBlockByNumber(blockNumber: number): Promise<Block | undefined>;
  getBlockCount(): Promise<number>;
  createBlock(block: InsertBlock): Promise<Block>;
  upsertBlock(block: InsertBlock): Promise<Block>;

  getAgents(limit?: number, offset?: number): Promise<Agent[]>;
  getAgentByAddress(address: string): Promise<Agent | undefined>;
  getAgentCount(): Promise<number>;
  getVerifiedAgents(limit?: number, offset?: number): Promise<Agent[]>;
  getVerifiedAgentCount(): Promise<number>;
  getTopAgents(limit?: number): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  upsertAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(address: string, updates: Partial<InsertAgent>): Promise<Agent | undefined>;
  searchAgents(query: string): Promise<Agent[]>;

  getEvents(limit?: number, offset?: number): Promise<AgentEvent[]>;
  getEventsByAgentId(agentId: string): Promise<AgentEvent[]>;
  getEventByTxHash(txHash: string): Promise<AgentEvent | undefined>;
  getEventsByBlockNumber(blockNumber: number): Promise<AgentEvent[]>;
  getEventCount(): Promise<number>;
  createEvent(event: InsertEvent): Promise<AgentEvent>;

  getPermissionsByAgentId(agentId: string): Promise<Permission[]>;
  createPermission(perm: InsertPermission): Promise<Permission>;

  getSnapshotsByAgentId(agentId: string): Promise<Snapshot[]>;
  createSnapshot(snap: InsertSnapshot): Promise<Snapshot>;

  getReceiptsByAgentId(agentId: string): Promise<Receipt[]>;
  getReceipts(limit?: number, offset?: number): Promise<Receipt[]>;
  getReceiptCount(): Promise<number>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;

  getStats(): Promise<{
    totalAgents: number;
    totalEvents: number;
    totalReceipts: number;
    totalPermissions: number;
    totalBlocks: number;
    totalSnapshots: number;
    latestBlock: number;
  }>;

  getBap578Stats(): Promise<{
    totalAgents: number;
    merkleLearningAgents: number;
    jsonLightAgents: number;
    erc8004Registered: number;
    totalMerkleRoots: number;
    learningModelBreakdown: Record<string, number>;
    chainCoverage: Record<string, number>;
  }>;

  getLastSyncedBlock(): Promise<number>;
  setLastSyncedBlock(blockNumber: number): Promise<void>;
  clearAllData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getBlocks(limit?: number, offset?: number): Promise<Block[]> {
    let query = db.select().from(blocks).orderBy(desc(blocks.blockNumber));
    if (limit) query = query.limit(limit) as any;
    if (offset) query = query.offset(offset) as any;
    return query;
  }

  async getBlockByNumber(blockNumber: number): Promise<Block | undefined> {
    const [block] = await db.select().from(blocks).where(eq(blocks.blockNumber, blockNumber));
    return block;
  }

  async getBlockCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(blocks);
    return result.count;
  }

  async createBlock(block: InsertBlock): Promise<Block> {
    const [created] = await db.insert(blocks).values(block).returning();
    return created;
  }

  async upsertBlock(block: InsertBlock): Promise<Block> {
    const [result] = await db.insert(blocks).values(block)
      .onConflictDoUpdate({
        target: blocks.blockNumber,
        set: {
          hash: block.hash,
          parentHash: block.parentHash,
          agentCount: block.agentCount,
          eventCount: block.eventCount,
          gasUsed: block.gasUsed,
          gasLimit: block.gasLimit,
          validator: block.validator,
          timestamp: block.timestamp,
        },
      })
      .returning();
    return result;
  }

  async getAgents(limit?: number, offset?: number): Promise<Agent[]> {
    let query = db.select().from(agents).orderBy(desc(agents.createdAt));
    if (limit) query = query.limit(limit) as any;
    if (offset) query = query.offset(offset) as any;
    return query;
  }

  async getAgentByAddress(address: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.address, address));
    return agent;
  }

  async getAgentCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(agents);
    return result.count;
  }

  async getVerifiedAgents(limit?: number, offset?: number): Promise<Agent[]> {
    let query = db.select().from(agents)
      .where(eq(agents.verified, true))
      .orderBy(desc(agents.createdAt));
    if (limit) query = query.limit(limit) as any;
    if (offset) query = query.offset(offset) as any;
    return query;
  }

  async getVerifiedAgentCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(agents).where(eq(agents.verified, true));
    return result.count;
  }

  async getTopAgents(limit = 20): Promise<Agent[]> {
    return db.select().from(agents)
      .orderBy(desc(agents.totalEvents))
      .limit(limit);
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [created] = await db.insert(agents).values(agent).returning();
    return created;
  }

  async upsertAgent(agent: InsertAgent): Promise<Agent> {
    const [result] = await db.insert(agents).values(agent)
      .onConflictDoUpdate({
        target: agents.address,
        set: {
          name: agent.name,
          description: agent.description,
          owner: agent.owner,
          status: agent.status,
          version: agent.version,
          logicAddress: agent.logicAddress,
          metadataUri: agent.metadataUri,
          learningRoot: agent.learningRoot,
          compiler: agent.compiler,
          license: agent.license,
          verified: agent.verified,
          balance: agent.balance,
          agentType: agent.agentType,
          erc8004Id: agent.erc8004Id,
          learningModel: agent.learningModel,
          chainSupport: agent.chainSupport,
          mintFee: agent.mintFee,
        },
      })
      .returning();
    return result;
  }

  async updateAgent(address: string, updates: Partial<InsertAgent>): Promise<Agent | undefined> {
    const [result] = await db.update(agents).set(updates).where(eq(agents.address, address)).returning();
    return result;
  }

  async searchAgents(query: string): Promise<Agent[]> {
    const searchTerm = `%${query}%`;
    return db
      .select()
      .from(agents)
      .where(
        or(
          ilike(agents.name, searchTerm),
          ilike(agents.address, searchTerm),
          ilike(agents.description, searchTerm)
        )
      )
      .orderBy(desc(agents.createdAt));
  }

  async getEvents(limit?: number, offset?: number): Promise<AgentEvent[]> {
    let query = db.select().from(events).orderBy(desc(events.timestamp));
    if (limit) query = query.limit(limit) as any;
    if (offset) query = query.offset(offset) as any;
    return query;
  }

  async getEventsByAgentId(agentId: string): Promise<AgentEvent[]> {
    return db
      .select()
      .from(events)
      .where(eq(events.agentId, agentId))
      .orderBy(desc(events.timestamp));
  }

  async getEventByTxHash(txHash: string): Promise<AgentEvent | undefined> {
    const [event] = await db.select().from(events).where(eq(events.txHash, txHash));
    return event;
  }

  async getEventsByBlockNumber(blockNumber: number): Promise<AgentEvent[]> {
    return db.select().from(events)
      .where(eq(events.blockNumber, blockNumber))
      .orderBy(desc(events.timestamp));
  }

  async getEventCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(events);
    return result.count;
  }

  async createEvent(event: InsertEvent): Promise<AgentEvent> {
    const [created] = await db.insert(events).values(event).returning();
    await db
      .update(agents)
      .set({ totalEvents: sql`${agents.totalEvents} + 1` })
      .where(eq(agents.id, event.agentId));
    return created;
  }

  async getPermissionsByAgentId(agentId: string): Promise<Permission[]> {
    return db
      .select()
      .from(permissions)
      .where(eq(permissions.agentId, agentId))
      .orderBy(desc(permissions.grantedAt));
  }

  async createPermission(perm: InsertPermission): Promise<Permission> {
    const [created] = await db.insert(permissions).values(perm).returning();
    return created;
  }

  async getSnapshotsByAgentId(agentId: string): Promise<Snapshot[]> {
    return db
      .select()
      .from(snapshots)
      .where(eq(snapshots.agentId, agentId))
      .orderBy(desc(snapshots.createdAt));
  }

  async createSnapshot(snap: InsertSnapshot): Promise<Snapshot> {
    const [created] = await db.insert(snapshots).values(snap).returning();
    return created;
  }

  async getReceiptsByAgentId(agentId: string): Promise<Receipt[]> {
    return db
      .select()
      .from(receipts)
      .where(eq(receipts.agentId, agentId))
      .orderBy(desc(receipts.timestamp));
  }

  async getReceipts(limit?: number, offset?: number): Promise<Receipt[]> {
    let query = db.select().from(receipts).orderBy(desc(receipts.timestamp));
    if (limit) query = query.limit(limit) as any;
    if (offset) query = query.offset(offset) as any;
    return query;
  }

  async getReceiptCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(receipts);
    return result.count;
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [created] = await db.insert(receipts).values(receipt).returning();
    await db
      .update(agents)
      .set({ totalReceipts: sql`${agents.totalReceipts} + 1` })
      .where(eq(agents.id, receipt.agentId));
    return created;
  }

  async getStats() {
    const [agentCount] = await db.select({ count: count() }).from(agents);
    const [eventCount] = await db.select({ count: count() }).from(events);
    const [receiptCount] = await db.select({ count: count() }).from(receipts);
    const [permCount] = await db.select({ count: count() }).from(permissions);
    const [blockCount] = await db.select({ count: count() }).from(blocks);
    const [snapCount] = await db.select({ count: count() }).from(snapshots);
    const latestBlock = await db.select({ blockNumber: blocks.blockNumber })
      .from(blocks).orderBy(desc(blocks.blockNumber)).limit(1);
    return {
      totalAgents: agentCount.count,
      totalEvents: eventCount.count,
      totalReceipts: receiptCount.count,
      totalPermissions: permCount.count,
      totalBlocks: blockCount.count,
      totalSnapshots: snapCount.count,
      latestBlock: latestBlock[0]?.blockNumber ?? 0,
    };
  }

  async getBap578Stats() {
    const allAgents = await db.select().from(agents);
    const [snapCount] = await db.select({ count: count() }).from(snapshots);

    const merkleLearning = allAgents.filter(a => a.agentType === "merkle_learning").length;
    const jsonLight = allAgents.filter(a => a.agentType === "json_light").length;
    const erc8004Registered = allAgents.filter(a => a.erc8004Id).length;

    const learningModelBreakdown: Record<string, number> = {};
    for (const a of allAgents) {
      if (a.learningModel) {
        learningModelBreakdown[a.learningModel] = (learningModelBreakdown[a.learningModel] || 0) + 1;
      }
    }

    const chainCoverage: Record<string, number> = {};
    for (const a of allAgents) {
      if (a.chainSupport) {
        for (const chain of a.chainSupport) {
          if (chain) chainCoverage[chain] = (chainCoverage[chain] || 0) + 1;
        }
      }
    }

    return {
      totalAgents: allAgents.length,
      merkleLearningAgents: merkleLearning,
      jsonLightAgents: jsonLight,
      erc8004Registered,
      totalMerkleRoots: snapCount.count,
      learningModelBreakdown,
      chainCoverage,
    };
  }

  async getAgentOperationStats() {
    const rows = await db.select({ method: events.method, cnt: count() })
      .from(events)
      .groupBy(events.method)
      .orderBy(desc(count()));
    const breakdown: Record<string, number> = {};
    for (const r of rows) {
      if (r.method) breakdown[r.method] = r.cnt;
    }
    const uniqueOwners = await db.selectDistinct({ owner: agents.owner }).from(agents);
    return {
      uniqueOwners: uniqueOwners.length,
      methodBreakdown: breakdown,
    };
  }

  async getLastSyncedBlock(): Promise<number> {
    const [state] = await db.select().from(syncState).limit(1);
    return state?.lastSyncedBlock ?? 0;
  }

  async getSyncState() {
    const [state] = await db.select().from(syncState).limit(1);
    return state ?? null;
  }

  async setLastSyncedBlock(blockNumber: number): Promise<void> {
    await db.insert(syncState).values({ id: "main", lastSyncedBlock: blockNumber, lastSyncTime: new Date(), isLive: true })
      .onConflictDoUpdate({
        target: syncState.id,
        set: { lastSyncedBlock: blockNumber, lastSyncTime: new Date(), isLive: true },
      });
  }

  async clearAllData(): Promise<void> {
    await db.delete(receipts);
    await db.delete(snapshots);
    await db.delete(permissions);
    await db.delete(events);
    await db.delete(agents);
    await db.delete(blocks);
    await db.delete(syncState);
  }
}

export const storage = new DatabaseStorage();
