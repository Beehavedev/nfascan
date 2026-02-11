import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/utils";
import { Check, X, Clock, FileText } from "lucide-react";
import type { AgentEvent } from "@shared/schema";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start py-2.5 border-b last:border-0 gap-1 sm:gap-0">
      <div className="sm:w-[220px] shrink-0 text-xs text-muted-foreground">{label}:</div>
      <div className="flex-1 min-w-0 text-sm">{children}</div>
    </div>
  );
}

export default function TxDetail() {
  const params = useParams<{ txHash: string }>();
  const [, navigate] = useLocation();

  const { data: tx, isLoading } = useQuery<AgentEvent>({
    queryKey: ["/api/tx", params.txHash],
  });

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-6 w-96" />
        <Card className="p-5 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-20 text-center">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Transaction Not Found</h2>
        <p className="text-sm text-muted-foreground font-mono break-all max-w-md mx-auto">{params.txHash}</p>
      </div>
    );
  }

  const statusIcon = tx.status === "confirmed" ? (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-chart-2/10 text-chart-2">
      <Check className="w-3.5 h-3.5" /> Success
    </span>
  ) : tx.status === "failed" ? (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-destructive/10 text-destructive">
      <X className="w-3.5 h-3.5" /> Failed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-chart-3/10 text-chart-3">
      <Clock className="w-3.5 h-3.5" /> Pending
    </span>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      <div className="border-b pb-4">
        <h1 className="text-lg font-semibold flex items-center gap-2" data-testid="text-tx-title">
          <FileText className="w-5 h-5 text-muted-foreground" />
          Transaction Details
        </h1>
      </div>

      <Card className="p-5">
        <DetailRow label="Transaction Hash">
          <span className="text-xs font-mono break-all" data-testid="text-tx-hash">{tx.txHash}</span>
        </DetailRow>
        <DetailRow label="Status">
          {statusIcon}
        </DetailRow>
        <DetailRow label="Block">
          <span
            className="text-xs font-mono bscscan-link cursor-pointer"
            onClick={() => navigate(`/block/${tx.blockNumber}`)}
            data-testid="link-tx-block"
          >
            {tx.blockNumber.toLocaleString()}
          </span>
        </DetailRow>
        <DetailRow label="Timestamp">
          <span className="text-xs">
            {new Date(tx.timestamp).toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })} ({formatTimeAgo(tx.timestamp)})
          </span>
        </DetailRow>
        <DetailRow label="From">
          {tx.fromAddress ? (
            <span className="text-xs font-mono bscscan-link break-all cursor-pointer" onClick={() => navigate(`/agent/${tx.fromAddress}`)} data-testid="link-tx-from">
              {tx.fromAddress}
            </span>
          ) : <span className="text-xs text-muted-foreground">-</span>}
        </DetailRow>
        <DetailRow label="To">
          {tx.toAddress ? (
            <span className="text-xs font-mono bscscan-link break-all cursor-pointer" onClick={() => navigate(`/agent/${tx.toAddress}`)} data-testid="link-tx-to">
              {tx.toAddress}
            </span>
          ) : <span className="text-xs text-muted-foreground">-</span>}
        </DetailRow>
        <DetailRow label="Value">
          <span className="text-xs font-medium">{tx.value ?? "0 NFA"}</span>
        </DetailRow>
        <DetailRow label="Transaction Fee">
          <span className="text-xs text-muted-foreground">
            {tx.gasUsed && tx.gasPrice ? `${tx.gasUsed} gas x ${tx.gasPrice}` : "-"}
          </span>
        </DetailRow>
        <DetailRow label="Gas Used">
          <span className="text-xs font-mono">{tx.gasUsed ?? "-"}</span>
        </DetailRow>
        <DetailRow label="Gas Price">
          <span className="text-xs font-mono">{tx.gasPrice ?? "-"}</span>
        </DetailRow>
        <DetailRow label="Method">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {tx.method ?? tx.type}
          </span>
        </DetailRow>
        <DetailRow label="Event Type">
          <span className="text-xs">{tx.type}</span>
        </DetailRow>
      </Card>
    </div>
  );
}
