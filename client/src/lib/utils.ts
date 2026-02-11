import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, chars = 6): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function getEventTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case "created": return "text-chart-2";
    case "transfer": return "text-primary";
    case "permission_granted": return "text-chart-3";
    case "permission_revoked": return "text-destructive";
    case "snapshot": return "text-chart-4";
    case "logic_update": return "text-chart-5";
    case "metadata_update": return "text-chart-1";
    default: return "text-muted-foreground";
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active": return "text-chart-2";
    case "paused": return "text-chart-4";
    case "inactive": return "text-destructive";
    case "confirmed": return "text-chart-2";
    case "pending": return "text-chart-4";
    case "failed": return "text-destructive";
    default: return "text-muted-foreground";
  }
}

export function getStatusBg(status: string): string {
  switch (status.toLowerCase()) {
    case "active": return "bg-chart-2/10";
    case "paused": return "bg-chart-4/10";
    case "inactive": return "bg-destructive/10";
    default: return "bg-muted";
  }
}
