import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Block } from "@shared/schema";
import { useState } from "react";

const PAGE_SIZE = 25;

export default function BlocksPage() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<{ data: Block[]; total: number }>({
    queryKey: ["/api/blocks", `?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`],
  });

  const blocks = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold" data-testid="text-blocks-title">Blocks</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Block #{blocks[0]?.blockNumber ?? "..."} to #{blocks[blocks.length - 1]?.blockNumber ?? "..."} (Total of {total.toLocaleString()} blocks)
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-blocks">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Block</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Age</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Txn</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Validator</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Gas Used</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">Gas Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : blocks.length > 0 ? (
                blocks.map((block) => (
                  <tr
                    key={block.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/block/${block.blockNumber}`)}
                    data-testid={`row-block-${block.blockNumber}`}
                  >
                    <td className="px-4 py-3">
                      <span className="bscscan-link text-xs font-medium whitespace-nowrap">{block.blockNumber.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(block.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs bscscan-link">{block.eventCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      {block.validator ? (
                        <span className="font-mono text-xs bscscan-link whitespace-nowrap">
                          {block.validator.slice(0, 10)}...{block.validator.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {block.gasUsed}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {block.gasLimit}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No blocks found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)} data-testid="button-blocks-prev">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} data-testid="button-blocks-next">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
