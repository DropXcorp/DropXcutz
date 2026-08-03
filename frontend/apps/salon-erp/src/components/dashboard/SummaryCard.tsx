import { motion } from "framer-motion";
import { LucideIcon, TrendingUp } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 320, damping: 24 }} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>

          <h2 className="mt-3 text-3xl font-bold text-zinc-900">{value}</h2>

          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />

            <span className="text-sm text-zinc-500">{subtitle}</span>
          </div>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
          <Icon className="h-6 w-6 text-zinc-700" />
        </div>
      </div>
    </motion.div>
  );
}
