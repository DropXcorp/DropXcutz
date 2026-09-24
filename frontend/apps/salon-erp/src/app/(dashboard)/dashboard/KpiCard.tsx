import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string;
  icon: LucideIcon;
}

export default function KpiCard({ title, value, icon: Icon }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>

        <Icon className="text-muted-foreground" size={20} />
      </div>

      <h2 className="text-3xl font-bold text-foreground">{value}</h2>
    </div>
  );
}
