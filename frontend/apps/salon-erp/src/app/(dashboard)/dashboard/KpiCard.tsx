import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string;
  icon: LucideIcon;
}

export default function KpiCard({
  title,
  value,
  icon: Icon,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

      <div className="mb-6 flex items-center justify-between">

        <h3 className="text-sm font-medium text-zinc-500">
          {title}
        </h3>

        <Icon className="text-zinc-400" size={20} />

      </div>

      <h2 className="text-3xl font-bold text-zinc-900">
        {value}
      </h2>

    </div>
  );
}