import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/utils";
import { Search } from "lucide-react";
import type { Agent } from "@shared/schema";

export default function SearchResults() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const query = new URLSearchParams(searchParams).get("q") || "";

  const { data: results, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/search", `?q=${encodeURIComponent(query)}`],
    enabled: !!query,
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold" data-testid="text-search-title">Search Results</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Showing results for "<span className="text-foreground font-medium">{query}</span>"
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-search-results">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Agent</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Address</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Version</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-14 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : results && results.length > 0 ? (
                results.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/agent/${agent.address}`)}
                    data-testid={`result-agent-${agent.address.slice(0, 8)}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <span className="bscscan-link text-sm font-medium">{agent.name}</span>
                        {agent.description && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-[300px] mt-0.5">{agent.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                        {agent.address.slice(0, 14)}...{agent.address.slice(-6)}
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
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-xs text-muted-foreground">{agent.version}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(agent.createdAt)}
                    </td>
                  </tr>
                ))
              ) : !isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Search className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No agents found matching "{query}"</p>
                    <p className="text-xs text-muted-foreground mt-1">Try searching by address, name, or transaction hash</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
