import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import type { Receipt } from "@shared/schema";
import { useState } from "react";

const PAGE_SIZE = 25;

export default function ReceiptsPage() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<{ data: Receipt[]; total: number }>({
    queryKey: ["/api/receipts", `?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`],
  });

  const receiptsList = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold" data-testid="text-receipts-title">Receipts</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          A total of {total.toLocaleString()} receipt(s) found
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-receipts">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txn Hash</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Action</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Block</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">From</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap"></th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">To</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Value</th>
                <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Age</th>
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
              ) : receiptsList.length > 0 ? (
                receiptsList.map((receipt) => (
                  <tr key={receipt.id} data-testid={`row-receipt-${receipt.id}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bscscan-link whitespace-nowrap">{receipt.txHash.slice(0, 16)}...</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">{receipt.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-mono text-xs bscscan-link whitespace-nowrap cursor-pointer"
                        onClick={() => navigate(`/block/${receipt.blockNumber}`)}
                      >
                        {receipt.blockNumber.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                        {receipt.fromAddress.slice(0, 10)}...{receipt.fromAddress.slice(-4)}
                      </span>
                    </td>
                    <td className="px-4 py-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[10px] text-muted-foreground border">OUT</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                        {receipt.toAddress.slice(0, 10)}...{receipt.toAddress.slice(-4)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
                      {receipt.value ?? "0 NFA"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {receipt.status === "confirmed" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : receipt.status === "failed" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                          <X className="w-3 h-3" />
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
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No receipts found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
