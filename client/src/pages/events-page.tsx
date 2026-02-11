import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import type { AgentEvent } from "@shared/schema";
import { useState } from "react";

const PAGE_SIZE = 25;

export default function EventsPage() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<{ data: AgentEvent[]; total: number }>({
    queryKey: ["/api/events", `?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`],
  });

  const eventsList = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold" data-testid="text-events-title">Transactions</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          More than {total.toLocaleString()} transactions found
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-events">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txn Hash</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Method</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Block</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Age</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">From</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap"></th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">To</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Value</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txn Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : eventsList.length > 0 ? (
                eventsList.map((event) => (
                  <tr key={event.id} data-testid={`row-event-${event.id}`}>
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
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(event.timestamp)}
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
                      {event.gasPrice ?? "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)} data-testid="button-events-prev">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} data-testid="button-events-next">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
