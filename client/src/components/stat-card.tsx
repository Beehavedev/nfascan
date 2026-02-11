import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  loading?: boolean;
}

export function StatCard({ label, value, icon: Icon, loading }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <span className="text-xl font-semibold font-mono" data-testid={`text-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </span>
          )}
        </div>
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
    </Card>
  );
}
