import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import {
  Check,
  Brain,
  FileJson,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { Agent } from "@shared/schema";
import { calculateTrustScore, getTrustLevel } from "@/lib/trust";

function TrustIndicator({ agent }: { agent: Agent }) {
  const score = calculateTrustScore(agent);
  const level = getTrustLevel(score);

  if (level === "high") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2 whitespace-nowrap">
        <ShieldCheck className="w-3 h-3" /> High
      </span>
    );
  }
  if (level === "medium") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-3/10 text-chart-3 whitespace-nowrap">
        <Shield className="w-3 h-3" /> Med
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive whitespace-nowrap">
      <ShieldAlert className="w-3 h-3" /> Low
    </span>
  );
}

export default function TopAgents() {
  const [, navigate] = useLocation();

  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents/top"],
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold" data-testid="text-top-agents-title">Top Agents by Activity</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Showing top agents ranked by total events. Trust column reflects BAP-578 compliance.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-top-agents">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Rank</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Agent</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Address</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Trust</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Type</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Balance</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txns</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : agents && agents.length > 0 ? (
                agents.map((agent, idx) => (
                  <tr
                    key={agent.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/agent/${agent.address}`)}
                    data-testid={`row-top-agent-${idx}`}
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {agent.verified && <Check className="w-3.5 h-3.5 text-chart-2 shrink-0" />}
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
                    <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
                      {agent.balance ?? "0 NFA"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {formatNumber(agent.totalEvents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded inline-block ${
                        agent.status === "active" ? "bg-chart-2/10 text-chart-2" :
                        agent.status === "paused" ? "bg-chart-3/10 text-chart-3" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No agents found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
