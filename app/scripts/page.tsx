"use client"

import { Play, Square, RefreshCcw, MoreVertical, Terminal, Cpu, Database, Globe, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const scripts = [
  { id: 1, name: "Data Sync Engine", status: "Running", type: "Database", lastRun: "2 mins ago", health: "Healthy", icon: Database },
  { id: 2, name: "Cloud Backup", status: "Scheduled", type: "Cloud", lastRun: "6 hours ago", health: "Healthy", icon: Cpu },
  { id: 3, name: "Web Scraper v2", status: "Stopped", type: "Web", lastRun: "1 day ago", health: "Critical", icon: Globe },
  { id: 4, name: "Security Auditor", status: "Running", type: "Security", lastRun: "Just now", health: "Healthy", icon: Shield },
  { id: 5, name: "Log Rotation", status: "Running", type: "System", lastRun: "15 mins ago", health: "Healthy", icon: Terminal },
]

export default function ScriptsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Scripts</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Monitor and manage your automated workflows.</p>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <Play size={20} fill="currentColor" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Active Scripts</p>
            <p className="text-2xl font-bold text-foreground">14</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
            <RefreshCcw size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">In Queue</p>
            <p className="text-2xl font-bold text-foreground">3</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Cpu size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">CPU Usage</p>
            <p className="text-2xl font-bold text-foreground">24%</p>
          </div>
        </div>
      </div>

      {/* Script List */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Operational Scripts</h2>
        <div className="flex flex-col gap-3">
          {scripts.map((script) => (
            <div key={script.id} className="glass-card group px-6 py-4 rounded-xl flex items-center justify-between hover:ring-1 hover:ring-primary/20 transition-all">
              <div className="flex items-center gap-5 flex-1">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <script.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-foreground truncate">{script.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-muted-foreground font-medium">{script.type}</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    <span className="text-[11px] text-muted-foreground font-medium">Last run: {script.lastRun}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                {/* Status Badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    script.status === "Running" ? "bg-green-500 animate-pulse" : 
                    script.status === "Scheduled" ? "bg-blue-500" : "bg-gray-400"
                  )} />
                  <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">{script.status}</span>
                </div>

                {/* Health */}
                <div className="hidden lg:block text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Health</p>
                  <p className={cn(
                    "text-[12px] font-semibold mt-0.5",
                    script.health === "Healthy" ? "text-green-500" : "text-red-500"
                  )}>{script.health}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className={cn(
                    "h-8 w-8 rounded-md flex items-center justify-center transition-all",
                    script.status === "Running" 
                      ? "text-red-500 hover:bg-red-500/10" 
                      : "text-green-500 hover:bg-green-500/10"
                  )}>
                    {script.status === "Running" ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>
                  <button className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
