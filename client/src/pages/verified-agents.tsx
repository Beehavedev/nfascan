import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Brain,
  FileJson,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
} from "lucide-react";
import type { Agent } from "@shared/schema";
import { calculateTrustScore, getTrustLevel } from "@/lib/trust";
import { useState } from "react";

const PAGE_SIZE = 25;

function TrustIndicator({ agent }: { agent: Agent }) {
  const score = calculateTrustScore(agent);
  const level = getTrustLevel(score);

  if (level === "high") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2 whitespace-nowrap" data-testid={`trust-high-${agent.address.slice(0, 8)}`}>
        <ShieldCheck className="w-3 h-3" /> High
      </span>
    );
  }
  if (level === "medium") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-3/10 text-chart-3 whitespace-nowrap" data-testid={`trust-med-${agent.address.slice(0, 8)}`}>
        <Shield className="w-3 h-3" /> Med
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive whitespace-nowrap" data-testid={`trust-low-${agent.address.slice(0, 8)}`}>
      <ShieldAlert className="w-3 h-3" /> Low
    </span>
  );
}

export default function VerifiedAgents() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<{ data: Agent[]; total: number }>({
    queryKey: ["/api/agents/verified", `?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`],
  });

  const agents = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-chart-2/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-chart-2" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" data-testid="text-verified-title">Verified Agents</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total.toLocaleString()} verified source-code agent(s) found. These contracts have publicly auditable code on BSC.
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-verified-agents">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">#</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Agent</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Address</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Trust</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Type</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">ERC-8004</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Compiler</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">License</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Balance</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txns</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : agents.length > 0 ? (
                agents.map((agent, idx) => (
                  <tr
                    key={agent.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/agent/${agent.address}`)}
                    data-testid={`row-verified-${agent.address.slice(0, 8)}`}
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-chart-2 shrink-0" />
                        <span className="bscscan-link text-sm font-medium whitespace-nowrap">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                        {agent.address.slice(0, 10)}...{agent.address.slice(-6)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TrustIndicator agent={agent} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${
                        agent.agentType === "merkle_learning" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {agent.agentType === "merkle_learning" ? <Brain className="w-3 h-3" /> : <FileJson className="w-3 h-3" />}
                        {agent.agentType === "merkle_learning" ? "Merkle" : "Light"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {agent.erc8004Id ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2 whitespace-nowrap">
                          <Check className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                          <AlertTriangle className="w-3 h-3" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{agent.compiler || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{agent.license || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
                      {agent.balance ?? "0 NFA"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-muted-foreground">{formatNumber(agent.totalEvents)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">No verified agents found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} ({total.toLocaleString()} verified agents)
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)} data-testid="button-verified-prev">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} data-testid="button-verified-next">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
