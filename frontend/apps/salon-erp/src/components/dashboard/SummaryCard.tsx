import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
}

export default function SummaryCard({ title, value, subtitle, icon: Icon }: SummaryCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 320, damping: 26 }}>
      <Card className="h-full gap-0 border-0 p-5 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">{value}</p>
            <p className="mt-2 truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
