import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { CountUp } from "@/components/ui/count-up"

type StatCardProps = {
  label: string
  value: string
  change: number
  icon: LucideIcon
  description?: string
}

export function StatCard({ label, value, change, icon: Icon, description }: StatCardProps) {
  const isNegative = change < 0
  const formattedChange = Math.abs(change).toFixed(1)

  // Parse value string (e.g., "$38k", "99.1%")
  const numberValue = parseFloat(value.replace(/[^0-9.]/g, ""))
  const prefix = value.match(/^\D+/)?.[0] || ""
  const suffix = value.match(/\D+$/)?.[0] || ""
  const decimals = value.includes(".") ? value.split(".")[1].length : 0

  return (
    <div className="group relative glass-card rounded-xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-white/50 text-muted-foreground group-hover:text-foreground transition-colors">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em]">{label}</span>
        </div>
        <div className={cn(
          "flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
          isNegative ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"
        )}>
          {isNegative ? "-" : "+"}
          <CountUp end={parseFloat(formattedChange)} decimals={1} suffix="%" />
        </div>
      </div>
      <div className="text-[32px] font-medium tracking-tight text-foreground leading-none">
        <CountUp end={numberValue} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      {description && (
        <p className="mt-2 text-[11px] text-muted-foreground/50 font-medium">{description}</p>
      )}
    </div>
  )
}
