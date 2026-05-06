import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { CountUp } from "@/components/ui/count-up"

type Project = {
  id: string
  name: string
  client: string
  type: string
  progress: number
  status: "active" | "completed" | "paused"
  due: string
}

const projects: Project[] = [
  { id: "#P-091", name: "Brand Redesign", client: "Acme Corp", type: "Design", progress: 78, status: "active", due: "May 12" },
  { id: "#P-090", name: "Mobile App v2", client: "TechFlow", type: "Development", progress: 100, status: "completed", due: "Apr 30" },
  { id: "#P-089", name: "SEO Audit", client: "GrowthLab", type: "Marketing", progress: 45, status: "active", due: "May 20" },
  { id: "#P-088", name: "Analytics Dashboard", client: "DataSync", type: "Development", progress: 30, status: "paused", due: "Jun 1" },
  { id: "#P-087", name: "Content Strategy", client: "Bloom Agency", type: "Marketing", progress: 92, status: "active", due: "May 7" },
]

const statusStyles = {
  active: "text-primary",
  completed: "text-success",
  paused: "text-muted-foreground",
}

const statusLabels = {
  active: "Active",
  completed: "Done",
  paused: "Paused",
}

export function RecentProjects() {
  const [filter, setFilter] = useState<"all" | Project["status"]>("all")
  const filtered = filter === "all" ? projects : projects.filter(p => p.status === filter)

  return (
    <section className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-transparent">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">Recent Projects</h2>
        </div>
        <div className="flex items-center gap-1">
          {(["all", "active", "completed", "paused"] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "text-[11px] font-medium px-2.5 py-1 rounded-md capitalize transition-colors",
                filter === f
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-[12px] table-auto">
          <thead>
            <tr>
              {["Project", "Client", "Type", "Progress", "Status", "Due"].map((h, i) => (
                <th key={i} className={cn(
                  "px-5 py-2 text-left text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-widest whitespace-nowrap",
                  i === 0 && "min-w-[140px]"
                )}>
                  {h}
                </th>
              ))}
              <th className="px-5 py-2 text-right text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-widest">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project, i) => (
              <tr
                key={project.id}
                className={cn(
                  "group transition-colors hover:bg-white/[0.02]",
                  i < filtered.length - 1 && "border-b border-border/10"
                )}
              >
                <td className="px-5 py-3">
                  <div className="font-medium text-foreground">{project.name}</div>
                  <div className="text-[10px] text-muted-foreground/40 font-mono mt-0.5">{project.id}</div>
                </td>
                <td className="px-5 py-3 text-muted-foreground/80">{project.client}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground/70 text-[10px] font-bold uppercase tracking-wider">
                    {project.type}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-20 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground/40 tabular-nums">
                      <CountUp end={project.progress} duration={1200} suffix="%" />
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={cn("text-[11px] font-semibold tracking-wide", statusStyles[project.status])}>
                    {statusLabels[project.status]}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground/50">{project.due}</td>
                <td className="px-5 py-3 text-right">
                  <button type="button" className="text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all p-1.5 rounded-md">
                    <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
