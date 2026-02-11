import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo, formatNumber } from "@/lib/utils";
import {
  Bot,
  Activity,
  Layers,
  Shield,
  Search,
  ArrowRight,
  Brain,
  FileJson,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Zap,
  PauseCircle,
  ArrowRightLeft,
  DollarSign,
  Users,
} from "lucide-react";
import type { Agent, AgentEvent, Block } from "@shared/schema";
import { useState } from "react";

interface Bap578Stats {
  totalAgents: number;
  merkleLearningAgents: number;
  jsonLightAgents: number;
  erc8004Registered: number;
  totalMerkleRoots: number;
  learningModelBreakdown: Record<string, number>;
  chainCoverage: Record<string, number>;
}

export default function Home() {
  const [, navigate] = useLocation();
  const [heroSearch, setHeroSearch] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalAgents: number;
    totalEvents: number;
    totalReceipts: number;
    totalPermissions: number;
    totalBlocks: number;
    totalSnapshots: number;
    latestBlock: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: bapStats, isLoading: bapLoading } = useQuery<Bap578Stats>({
    queryKey: ["/api/bap578/stats"],
  });

  const { data: recentBlocksRes, isLoading: blocksLoading } = useQuery<{ data: Block[]; total: number }>({
    queryKey: ["/api/blocks", "?limit=6"],
  });

  const { data: recentEventsRes, isLoading: eventsLoading } = useQuery<{ data: AgentEvent[]; total: number }>({
    queryKey: ["/api/events", "?limit=6"],
  });

  const { data: verifiedRes } = useQuery<{ data: Agent[]; total: number }>({
    queryKey: ["/api/agents/verified", "?limit=5"],
  });

  const { data: allAgentsRes } = useQuery<{ data: Agent[]; total: number }>({
    queryKey: ["/api/agents", "?limit=50"],
  });

  const { data: syncStatus } = useQuery<{
    lastSyncedBlock: number;
    lastSyncAt: string | null;
    network: string;
    source: string;
  }>({
    queryKey: ["/api/sync/status"],
    refetchInterval: 30000,
  });

  const { data: opsStats } = useQuery<{
    uniqueOwners: number;
    methodBreakdown: Record<string, number>;
  }>({
    queryKey: ["/api/agents/operations"],
  });

  const recentBlocks = recentBlocksRes?.data ?? [];
  const recentEvents = recentEventsRes?.data ?? [];
  const verifiedAgents = verifiedRes?.data ?? [];
  const allAgents = allAgentsRes?.data ?? [];

  const unverifiedCount = allAgents.filter(a => !a.verified && !a.erc8004Id).length;
  const erc8004Pct = bapStats ? Math.round((bapStats.erc8004Registered / bapStats.totalAgents) * 100) : 0;

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="bg-card border-b">
        <div className="max-w-[1400px] mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-hero-title">
              Verify Real AI Agents on BNB Chain
            </h1>
            {syncStatus?.source === "live" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-chart-2/15 text-chart-2 border border-chart-2/30" data-testid="badge-live-data">
                <Radio className="w-3 h-3 animate-pulse" />
                Live Data
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mb-6 max-w-xl">
            NfaScan filters genuine BAP-578 Non-Fungible Agents from fakes using live BNB Chain data.
            {syncStatus?.lastSyncedBlock ? (
              <span className="text-xs ml-1">Block #{syncStatus.lastSyncedBlock.toLocaleString()}</span>
            ) : null}
          </p>

          <form onSubmit={handleHeroSearch} className="max-w-2xl">
            <div className="relative">
              <input
                type="search"
                placeholder="Search by Address / Txn Hash / Block / Agent Name"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="w-full h-12 pl-4 pr-14 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                data-testid="input-hero-search"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-primary rounded-r-md"
                data-testid="button-hero-search"
              >
                <Search className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 -mt-1">
        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase">Verified Agents</span>
                <div className="text-sm font-semibold" data-testid="text-stat-verified">
                  {bapLoading ? <Skeleton className="h-5 w-12" /> : `${bapStats?.erc8004Registered ?? 0} / ${bapStats?.totalAgents ?? 0}`}
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase">Merkle Learning</span>
                <div className="text-sm font-semibold" data-testid="text-stat-merkle">
                  {bapLoading ? <Skeleton className="h-5 w-12" /> : bapStats?.merkleLearningAgents ?? 0}
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase">Transactions</span>
                <div className="text-sm font-semibold" data-testid="text-stat-total-events">
                  {statsLoading ? <Skeleton className="h-5 w-16" /> : formatNumber(stats?.totalEvents ?? 0)}
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase">Latest Block</span>
                <div className="text-sm font-semibold bscscan-link cursor-pointer" data-testid="text-stat-latest-block"
                  onClick={() => stats && navigate(`/block/${stats.latestBlock}`)}
                >
                  {statsLoading ? <Skeleton className="h-5 w-20" /> : `#${(stats?.latestBlock ?? 0).toLocaleString()}`}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 flex-wrap px-4 py-3 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-chart-2" />
              BAP-578 Compliance Overview
            </h2>
            <button
              onClick={() => navigate("/bap578")}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              data-testid="button-view-bap578"
            >
              Full protocol details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
            <div className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                <span className="text-xs text-muted-foreground">ERC-8004 Registered</span>
                <span className="text-xs font-semibold text-chart-2" data-testid="text-erc8004-pct">{erc8004Pct}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-chart-2 rounded-full" style={{ width: `${erc8004Pct}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                {bapStats?.erc8004Registered ?? 0} of {bapStats?.totalAgents ?? 0} agents have verified on-chain identity
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                <span className="text-xs text-muted-foreground">Agent Type Split</span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium" data-testid="text-home-merkle">{bapStats?.merkleLearningAgents ?? 0} Merkle</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium" data-testid="text-home-light">{bapStats?.jsonLightAgents ?? 0} Light</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Merkle learning agents store tamper-proof learning proofs on-chain
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs text-muted-foreground">Unverified Agents</span>
              </div>
              <span className="text-lg font-bold text-destructive" data-testid="text-unverified-count">{unverifiedCount}</span>
              <p className="text-[10px] text-muted-foreground mt-1">
                Agents lacking both source verification and ERC-8004 identity. Exercise caution.
              </p>
            </div>
          </div>
        </Card>

        {opsStats && (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 flex-wrap px-4 py-3 border-b">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Contract Activity
              </h2>
              <span className="text-xs text-muted-foreground" data-testid="text-unique-owners">
                {opsStats.uniqueOwners} unique contract owners
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x">
              {(() => {
                const topMethods = Object.entries(opsStats.methodBreakdown)
                  .filter(([m]) => !m.startsWith("call_"))
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6);
                const icons = [Zap, DollarSign, ArrowRightLeft, PauseCircle, Brain, Shield];
                const colors = ["text-primary", "text-chart-2", "text-chart-4", "text-destructive", "text-primary", "text-chart-2"];
                return topMethods.map(([method, count], i) => {
                  const Icon = icons[i] || Zap;
                  const color = colors[i] || "text-primary";
                  return (
                    <div key={method} className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className="text-xs text-muted-foreground">{method}</span>
                      </div>
                      <span className="text-lg font-bold" data-testid={`text-ops-${method}`}>{formatNumber(count)}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 flex-wrap px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">Latest Blocks</h2>
              <button
                onClick={() => navigate("/blocks")}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                data-testid="button-view-all-blocks"
              >
                View all blocks <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y">
              {blocksLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              ) : recentBlocks.length > 0 ? (
                recentBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="px-4 py-3 flex items-center gap-3 hover-elevate cursor-pointer"
                    onClick={() => navigate(`/block/${block.blockNumber}`)}
                    data-testid={`card-block-${block.blockNumber}`}
                  >
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0 text-xs font-mono text-muted-foreground">
                      Bk
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm bscscan-link font-medium cursor-pointer">
                          {block.blockNumber.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">{block.validator?.slice(0, 12)}...</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs bscscan-link">{block.eventCount} txns</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {formatTimeAgo(block.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">No blocks found</div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 flex-wrap px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">Latest Transactions</h2>
              <button
                onClick={() => navigate("/events")}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                data-testid="button-view-all-events"
              >
                View all transactions <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y">
              {eventsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              ) : recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="px-4 py-3 flex items-center gap-3 hover-elevate cursor-pointer"
                    onClick={() => navigate(`/tx/${event.txHash}`)}
                  >
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0 text-xs font-mono text-muted-foreground">
                      Tx
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono bscscan-link cursor-pointer truncate max-w-[180px]">
                          {event.txHash.slice(0, 18)}...
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>
                          From <span className="font-mono bscscan-link cursor-pointer">{event.fromAddress ? `${event.fromAddress.slice(0, 8)}...${event.fromAddress.slice(-4)}` : "-"}</span>
                        </span>
                        <span>
                          To <span className="font-mono bscscan-link cursor-pointer">{event.toAddress ? `${event.toAddress.slice(0, 8)}...${event.toAddress.slice(-4)}` : "-"}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs">
                        {event.value ?? "0 NFA"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {formatTimeAgo(event.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">No transactions found</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
