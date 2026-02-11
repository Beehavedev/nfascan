import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Shield } from "lucide-react";
import type { Agent } from "@shared/schema";

export default function PermissionsPage() {
  const [, navigate] = useLocation();

  const { data: agentsData, isLoading } = useQuery<{ data: Agent[]; total: number }>({
    queryKey: ["/api/agents", "?limit=50"],
  });

  const agents = agentsData?.data ?? [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold flex items-center gap-2" data-testid="text-permissions-title">
          <Shield className="w-5 h-5 text-muted-foreground" />
          Agent Permissions
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View permissions by selecting an agent below
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-agents-permissions">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Agent</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Address</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txns</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : agents.length > 0 ? (
                agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/agent/${agent.address}`)}
                    data-testid={`row-perm-agent-${agent.address.slice(0, 8)}`}
                  >
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
                      <span className={`text-[10px] px-1.5 py-0.5 rounded inline-block ${
                        agent.status === "active" ? "bg-chart-2/10 text-chart-2" :
                        agent.status === "paused" ? "bg-chart-3/10 text-chart-3" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">{agent.totalEvents}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No agents found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
