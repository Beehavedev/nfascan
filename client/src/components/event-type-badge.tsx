interface EventTypeBadgeProps {
  type: string;
}

const eventConfig: Record<string, { label: string; color: string }> = {
  created: { label: "Created", color: "bg-chart-2/10 text-chart-2" },
  transfer: { label: "Transfer", color: "bg-primary/10 text-primary" },
  permission_granted: { label: "Perm Granted", color: "bg-chart-3/10 text-chart-3" },
  permission_revoked: { label: "Perm Revoked", color: "bg-destructive/10 text-destructive" },
  snapshot: { label: "Snapshot", color: "bg-chart-4/10 text-chart-4" },
  logic_update: { label: "Logic Update", color: "bg-chart-3/10 text-chart-3" },
  metadata_update: { label: "Meta Update", color: "bg-muted text-muted-foreground" },
};

export function EventTypeBadge({ type }: EventTypeBadgeProps) {
  const config = eventConfig[type.toLowerCase()] || {
    label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${config.color}`}>
      {config.label}
    </span>
  );
}
