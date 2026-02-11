import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/utils";
import {
  Bot,
  Check,
  X,
  Award,
  Brain,
  FileJson,
  Shield,
  Globe,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { Agent, AgentEvent, Permission, Snapshot, Receipt as ReceiptType } from "@shared/schema";
import { calculateTrustScore, getTrustLevel } from "@/lib/trust";
import { useState } from "react";

function OverviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start py-2.5 border-b last:border-0 gap-1 sm:gap-0">
      <div className="sm:w-[200px] shrink-0 text-xs text-muted-foreground flex items-center gap-1.5">
        {label}:
      </div>
      <div className="flex-1 min-w-0 text-sm">{children}</div>
    </div>
  );
}

export default function AgentDetail() {
  const params = useParams<{ address: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("events");

  const { data: agent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: ["/api/agents", params.address],
  });

  const { data: agentEvents, isLoading: eventsLoading } = useQuery<AgentEvent[]>({
    queryKey: ["/api/agents", params.address, "events"],
    enabled: !!agent,
  });

  const { data: agentPermissions, isLoading: permsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/agents", params.address, "permissions"],
    enabled: !!agent,
  });

  const { data: agentSnapshots, isLoading: snapsLoading } = useQuery<Snapshot[]>({
    queryKey: ["/api/agents", params.address, "snapshots"],
    enabled: !!agent,
  });

  const { data: agentReceipts, isLoading: receiptsLoading } = useQuery<ReceiptType[]>({
    queryKey: ["/api/agents", params.address, "receipts"],
    enabled: !!agent,
  });

  if (agentLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-6 w-64" />
        <Card className="p-5 space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-20 text-center">
        <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Agent Not Found</h2>
        <p className="text-sm text-muted-foreground">No agent found with address {params.address}</p>
      </div>
    );
  }

  const tabs = [
    { id: "events", label: "Transactions", count: agentEvents?.length },
    { id: "receipts", label: "Internal Txns", count: agentReceipts?.length },
    { id: "permissions", label: "Permissions", count: agentPermissions?.length },
    { id: "snapshots", label: "Snapshots", count: agentSnapshots?.length },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-lg font-semibold flex items-center gap-2" data-testid="text-agent-name">
            <Bot className="w-5 h-5 text-muted-foreground" />
            Agent: {agent.name}
          </h1>
          {agent.verified && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2">
              <Award className="w-3 h-3" /> Verified
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            agent.status === "active" ? "bg-chart-2/10 text-chart-2" :
            agent.status === "paused" ? "bg-chart-3/10 text-chart-3" :
            "bg-destructive/10 text-destructive"
          }`}>
            {agent.status}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
            agent.agentType === "merkle_learning" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`} data-testid="badge-agent-type">
            {agent.agentType === "merkle_learning" ? <Brain className="w-3 h-3" /> : <FileJson className="w-3 h-3" />}
            {agent.agentType === "merkle_learning" ? "Merkle Learning" : "JSON Light"}
          </span>
          {(() => {
            const score = calculateTrustScore(agent);
            const level = getTrustLevel(score);
            if (level === "high") return (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2" data-testid="badge-trust-level">
                <ShieldCheck className="w-3 h-3" /> High Trust ({score}/100)
              </span>
            );
            if (level === "medium") return (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-3/10 text-chart-3" data-testid="badge-trust-level">
                <Shield className="w-3 h-3" /> Medium Trust ({score}/100)
              </span>
            );
            return (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive" data-testid="badge-trust-level">
                <ShieldAlert className="w-3 h-3" /> Low Trust ({score}/100)
              </span>
            );
          })()}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono" data-testid="text-agent-address">{agent.address}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overview</h3>
          <OverviewRow label="Balance">
            <span className="text-xs font-semibold">{agent.balance ?? "0 NFA"}</span>
          </OverviewRow>
          <OverviewRow label="Owner">
            <span className="font-mono text-xs bscscan-link">{agent.owner}</span>
          </OverviewRow>
          <OverviewRow label="Transactions">
            <span className="text-xs">{agent.totalEvents} txns</span>
          </OverviewRow>
          <OverviewRow label="Version">
            <span className="font-mono text-xs">{agent.version}</span>
          </OverviewRow>
          <OverviewRow label="Created">
            <span className="text-xs">
              {new Date(agent.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </OverviewRow>
          {agent.description && (
            <OverviewRow label="Description">
              <span className="text-xs text-muted-foreground">{agent.description}</span>
            </OverviewRow>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">BAP-578 Info</h3>
          <OverviewRow label="Agent Type">
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
              agent.agentType === "merkle_learning" ? "text-primary" : "text-muted-foreground"
            }`} data-testid="text-agent-type">
              {agent.agentType === "merkle_learning" ? <Brain className="w-3.5 h-3.5" /> : <FileJson className="w-3.5 h-3.5" />}
              {agent.agentType === "merkle_learning" ? "Merkle Tree Learning" : "JSON Light Memory"}
            </span>
          </OverviewRow>
          <OverviewRow label="ERC-8004 Identity">
            {agent.erc8004Id ? (
              <span className="inline-flex items-center gap-1 text-xs">
                <Shield className="w-3.5 h-3.5 text-chart-2" />
                <span className="font-mono text-xs break-all" data-testid="text-agent-erc8004">{agent.erc8004Id}</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Not registered</span>
            )}
          </OverviewRow>
          {agent.learningModel && (
            <OverviewRow label="Learning Model">
              <span className="text-xs" data-testid="text-agent-learning-model">
                {agent.learningModel === "reinforcement" ? "Reinforcement Learning" :
                 agent.learningModel === "rag" ? "RAG (Retrieval-Augmented)" :
                 agent.learningModel === "mcp" ? "MCP (Model Context Protocol)" :
                 agent.learningModel === "fine_tuning" ? "Fine-Tuning" :
                 agent.learningModel === "hybrid" ? "Hybrid" : agent.learningModel}
              </span>
            </OverviewRow>
          )}
          <OverviewRow label="Learning Root">
            {agent.learningRoot ? (
              <span className="font-mono text-xs break-all">{agent.learningRoot}</span>
            ) : (
              <span className="text-xs text-muted-foreground">Not set</span>
            )}
          </OverviewRow>
          {agent.chainSupport && agent.chainSupport.length > 0 && (
            <OverviewRow label="Chain Support">
              <div className="flex flex-wrap gap-1" data-testid="text-agent-chains">
                {agent.chainSupport.map((chain: string) => (
                  <span key={chain} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    <Globe className="w-2.5 h-2.5" />
                    {chain === "bsc_mainnet" ? "BSC" : chain === "ethereum" ? "ETH" :
                     chain === "arbitrum" ? "ARB" : chain === "optimism" ? "OP" :
                     chain === "base" ? "BASE" : chain === "polygon" ? "MATIC" :
                     chain === "avalanche" ? "AVAX" : chain}
                  </span>
                ))}
              </div>
            </OverviewRow>
          )}
          {agent.mintFee && (
            <OverviewRow label="Mint Fee">
              <span className="text-xs">{agent.mintFee}</span>
            </OverviewRow>
          )}
          <OverviewRow label="Logic Address">
            {agent.logicAddress ? (
              <span className="font-mono text-xs bscscan-link">{agent.logicAddress}</span>
            ) : (
              <span className="text-xs text-muted-foreground">Not set</span>
            )}
          </OverviewRow>
          <OverviewRow label="Metadata URI">
            {agent.metadataUri ? (
              <span className="font-mono text-xs break-all bscscan-link">{agent.metadataUri}</span>
            ) : (
              <span className="text-xs text-muted-foreground">Not set</span>
            )}
          </OverviewRow>
          {agent.compiler && (
            <OverviewRow label="Compiler">
              <span className="text-xs">{agent.compiler}</span>
            </OverviewRow>
          )}
          {agent.license && (
            <OverviewRow label="License">
              <span className="text-xs">{agent.license}</span>
            </OverviewRow>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "events" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txn Hash</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Method</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Block</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">From</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap"></th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">To</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Value</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {eventsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : agentEvents && agentEvents.length > 0 ? (
                  agentEvents.map((event) => (
                    <tr key={event.id} data-testid={`event-row-${event.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {event.status === "confirmed" ? (
                            <span className="w-4 h-4 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-chart-2" />
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                              <X className="w-2.5 h-2.5 text-destructive" />
                            </span>
                          )}
                          <span
                            className="font-mono text-xs bscscan-link whitespace-nowrap cursor-pointer"
                            onClick={() => navigate(`/tx/${event.txHash}`)}
                          >
                            {event.txHash.slice(0, 16)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                          {event.method ?? event.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs bscscan-link whitespace-nowrap cursor-pointer"
                          onClick={() => navigate(`/block/${event.blockNumber}`)}
                        >
                          {event.blockNumber.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {event.fromAddress ? (
                          <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                            {event.fromAddress.slice(0, 10)}...{event.fromAddress.slice(-4)}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[10px] text-muted-foreground border">IN</span>
                      </td>
                      <td className="px-4 py-3">
                        {event.toAddress ? (
                          <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                            {event.toAddress.slice(0, 10)}...{event.toAddress.slice(-4)}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
                        {event.value ?? "0 NFA"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(event.timestamp)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">No transactions recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "receipts" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txn Hash</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Action</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Block</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">From</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">To</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Value</th>
                  <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {receiptsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      ))}
                    </tr>
                  ))
                ) : agentReceipts && agentReceipts.length > 0 ? (
                  agentReceipts.map((receipt) => (
                    <tr key={receipt.id} data-testid={`receipt-row-${receipt.id}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bscscan-link whitespace-nowrap">{receipt.txHash.slice(0, 16)}...</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">{receipt.action}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bscscan-link whitespace-nowrap cursor-pointer" onClick={() => navigate(`/block/${receipt.blockNumber}`)}>
                          {receipt.blockNumber.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                          {receipt.fromAddress.slice(0, 10)}...{receipt.fromAddress.slice(-4)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                          {receipt.toAddress.slice(0, 10)}...{receipt.toAddress.slice(-4)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs whitespace-nowrap">{receipt.value ?? "0 NFA"}</td>
                      <td className="px-4 py-3 text-center">
                        {receipt.status === "confirmed" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2">
                            <Check className="w-3 h-3" /> Success
                          </span>
                        ) : receipt.status === "failed" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                            <X className="w-3 h-3" /> Fail
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-chart-3/10 text-chart-3">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(receipt.timestamp)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">No internal transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Permission</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Scope</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Granted To</th>
                  <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {permsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : agentPermissions && agentPermissions.length > 0 ? (
                  agentPermissions.map((perm) => (
                    <tr key={perm.id} data-testid={`perm-row-${perm.id}`}>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">{perm.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{perm.scope}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                          {perm.grantedTo.slice(0, 10)}...{perm.grantedTo.slice(-4)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {perm.active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                            <X className="w-3 h-3" /> Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(perm.grantedAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">No permissions configured</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "snapshots" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Root Hash</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Parent Hash</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Block</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Size</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {snapsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : agentSnapshots && agentSnapshots.length > 0 ? (
                  agentSnapshots.map((snap) => (
                    <tr key={snap.id} data-testid={`snap-row-${snap.id}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                          {snap.rootHash.slice(0, 16)}...{snap.rootHash.slice(-4)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {snap.parentHash ? (
                          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {snap.parentHash.slice(0, 16)}...{snap.parentHash.slice(-4)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Genesis</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs bscscan-link whitespace-nowrap cursor-pointer"
                          onClick={() => navigate(`/block/${snap.blockNumber}`)}
                        >
                          {snap.blockNumber.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs">{snap.size.toLocaleString()} bytes</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(snap.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">No learning snapshots</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
