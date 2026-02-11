import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/utils";
import { Layers } from "lucide-react";
import type { Block, AgentEvent } from "@shared/schema";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start py-2.5 border-b last:border-0 gap-1 sm:gap-0">
      <div className="sm:w-[200px] shrink-0 text-xs text-muted-foreground">{label}:</div>
      <div className="flex-1 min-w-0 text-sm">{children}</div>
    </div>
  );
}

export default function BlockDetail() {
  const params = useParams<{ blockNumber: string }>();
  const [, navigate] = useLocation();
  const blockNumber = parseInt(params.blockNumber);

  const { data: block, isLoading } = useQuery<Block>({
    queryKey: ["/api/blocks", params.blockNumber],
  });

  const { data: blockEvents } = useQuery<AgentEvent[]>({
    queryKey: ["/api/blocks", params.blockNumber, "events"],
    enabled: !!block,
  });

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-6 w-64" />
        <Card className="p-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-20 text-center">
        <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Block Not Found</h2>
        <p className="text-sm text-muted-foreground">Block #{params.blockNumber} does not exist</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      <div className="border-b pb-4">
        <h1 className="text-lg font-semibold flex items-center gap-2" data-testid="text-block-title">
          <Layers className="w-5 h-5 text-muted-foreground" />
          Block #{block.blockNumber.toLocaleString()}
        </h1>
      </div>

      <Card className="p-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overview</h3>
        <DetailRow label="Block Height">
          <span className="text-xs font-mono">{block.blockNumber.toLocaleString()}</span>
        </DetailRow>
        <DetailRow label="Timestamp">
          <span className="text-xs">
            {new Date(block.timestamp).toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })} ({formatTimeAgo(block.timestamp)})
          </span>
        </DetailRow>
        <DetailRow label="Transactions">
          <span className="text-xs bscscan-link">{block.eventCount} transactions</span>
        </DetailRow>
        <DetailRow label="Block Hash">
          <span className="text-xs font-mono break-all">{block.hash}</span>
        </DetailRow>
        <DetailRow label="Parent Hash">
          <span className="text-xs font-mono break-all text-muted-foreground">{block.parentHash ?? "Genesis Block"}</span>
        </DetailRow>
        <DetailRow label="Validated By">
          {block.validator ? (
            <span className="text-xs font-mono bscscan-link break-all">{block.validator}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Unknown</span>
          )}
        </DetailRow>
        <DetailRow label="Gas Used">
          <span className="text-xs">{block.gasUsed}</span>
        </DetailRow>
        <DetailRow label="Gas Limit">
          <span className="text-xs">{block.gasLimit}</span>
        </DetailRow>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-block-events">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txn Hash</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Method</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">From</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap"></th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">To</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Value</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txn Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {blockEvents && blockEvents.length > 0 ? (
                blockEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/tx/${event.txHash}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bscscan-link whitespace-nowrap">{event.txHash.slice(0, 16)}...</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                        {event.method ?? event.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {event.fromAddress ? (
                        <span className="font-mono text-xs bscscan-link whitespace-nowrap">{event.fromAddress.slice(0, 10)}...{event.fromAddress.slice(-4)}</span>
                      ) : <span className="text-xs text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[10px] text-muted-foreground border">IN</span>
                    </td>
                    <td className="px-4 py-3">
                      {event.toAddress ? (
                        <span className="font-mono text-xs bscscan-link whitespace-nowrap">{event.toAddress.slice(0, 10)}...{event.toAddress.slice(-4)}</span>
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
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">No transactions in this block</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
