"use client"

import { CheckCircle2, UserPlus, MessageSquare, BarChart2, FolderPlus } from "lucide-react"

type Event = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  desc: string
  time: string
}

const events: Event[] = [
  { icon: FolderPlus, title: "New project created", desc: "Brand Redesign · Acme Corp", time: "2m ago" },
  { icon: CheckCircle2, title: "Task completed", desc: "Homepage mockup approved", time: "18m ago" },
  { icon: UserPlus, title: "Member invited", desc: "sarah@techflow.io joined", time: "1h ago" },
  { icon: MessageSquare, title: "New comment", desc: "On Analytics Dashboard", time: "2h ago" },
  { icon: BarChart2, title: "Report generated", desc: "Monthly Q1 summary ready", time: "3h ago" },
]

export function ActivityFeed() {
  return (
    <section className="glass-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/30 bg-transparent">
        <h2 className="text-[13px] font-semibold text-foreground">Activity</h2>
      </div>

      <div className="divide-y divide-border/10">
        {events.map((event, i) => {
          const Icon = event.icon
          return (
            <div key={i} className="flex items-start gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors">
              <Icon className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-foreground truncate">{event.title}</div>
                <div className="text-[11px] text-muted-foreground/50 mt-0.5 truncate">{event.desc}</div>
              </div>
              <span className="text-[11px] text-muted-foreground/30 shrink-0 mt-0.5">{event.time}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
