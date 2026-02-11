import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockNumber: integer("block_number").notNull().unique(),
  hash: varchar("hash", { length: 66 }).notNull(),
  parentHash: varchar("parent_hash", { length: 66 }),
  agentCount: integer("agent_count").notNull().default(0),
  eventCount: integer("event_count").notNull().default(0),
  gasUsed: text("gas_used"),
  gasLimit: text("gas_limit"),
  validator: varchar("validator", { length: 66 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
});

export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocks.$inferSelect;

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: varchar("address", { length: 66 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  owner: varchar("owner", { length: 66 }).notNull(),
  status: text("status").notNull().default("active"),
  version: text("version").notNull().default("1.0.0"),
  logicAddress: varchar("logic_address", { length: 66 }),
  metadataUri: text("metadata_uri"),
  learningRoot: varchar("learning_root", { length: 66 }),
  compiler: text("compiler"),
  license: text("license"),
  verified: boolean("verified").notNull().default(false),
  totalEvents: integer("total_events").notNull().default(0),
  totalReceipts: integer("total_receipts").notNull().default(0),
  balance: text("balance"),
  agentType: text("agent_type").notNull().default("merkle_learning"),
  erc8004Id: varchar("erc8004_id", { length: 66 }),
  learningModel: text("learning_model"),
  chainSupport: text("chain_support").array(),
  mintFee: text("mint_fee"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  totalEvents: true,
  totalReceipts: true,
  createdAt: true,
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  type: text("type").notNull(),
  txHash: varchar("tx_hash", { length: 66 }).notNull(),
  blockNumber: integer("block_number").notNull(),
  fromAddress: varchar("from_address", { length: 66 }),
  toAddress: varchar("to_address", { length: 66 }),
  value: text("value"),
  gasUsed: text("gas_used"),
  gasPrice: text("gas_price"),
  status: text("status").notNull().default("confirmed"),
  method: text("method"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  timestamp: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type AgentEvent = typeof events.$inferSelect;

export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  name: text("name").notNull(),
  grantedTo: varchar("granted_to", { length: 66 }).notNull(),
  scope: text("scope").notNull(),
  active: boolean("active").notNull().default(true),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  grantedAt: true,
});

export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

export const snapshots = pgTable("snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  rootHash: varchar("root_hash", { length: 66 }).notNull(),
  parentHash: varchar("parent_hash", { length: 66 }),
  size: integer("size").notNull(),
  blockNumber: integer("block_number").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSnapshotSchema = createInsertSchema(snapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertSnapshot = z.infer<typeof insertSnapshotSchema>;
export type Snapshot = typeof snapshots.$inferSelect;

export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  action: text("action").notNull(),
  txHash: varchar("tx_hash", { length: 66 }).notNull(),
  fromAddress: varchar("from_address", { length: 66 }).notNull(),
  toAddress: varchar("to_address", { length: 66 }).notNull(),
  value: text("value"),
  status: text("status").notNull().default("confirmed"),
  blockNumber: integer("block_number").notNull(),
  gasUsed: text("gas_used"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  timestamp: true,
});

export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;

export const syncState = pgTable("sync_state", {
  id: varchar("id").primaryKey().default("main"),
  lastSyncedBlock: integer("last_synced_block").notNull().default(0),
  lastSyncTime: timestamp("last_sync_time").notNull().defaultNow(),
  isLive: boolean("is_live").notNull().default(false),
});
