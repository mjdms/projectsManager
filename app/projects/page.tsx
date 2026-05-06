"use client"

import { Plus, Search, Filter, MoreHorizontal, Users as UsersIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const projects = [
  { id: 1, name: "Nexus Dashboard", status: "In Progress", progress: 65, team: 4, deadline: "May 24", category: "Design" },
  { id: 2, name: "Mobile App Redesign", status: "On Hold", progress: 32, team: 2, deadline: "Jun 12", category: "Development" },
  { id: 3, name: "Branding Guidelines", status: "Completed", progress: 100, team: 3, deadline: "Apr 10", category: "Marketing" },
  { id: 4, name: "SEO Optimization", status: "In Progress", progress: 45, team: 5, deadline: "May 30", category: "Marketing" },
  { id: 5, name: "Backend Migration", status: "In Progress", progress: 12, team: 3, deadline: "Jul 05", category: "Development" },
  { id: 6, name: "User Research", status: "Planning", progress: 0, team: 2, deadline: "Aug 15", category: "Design" },
]

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Projects</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage and track your ongoing initiatives.</p>
        </div>
        <button
          type="button"
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Project
        </button>
      </header>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="w-full h-10 pl-10 pr-4 rounded-md bg-white border border-border/40 text-[13px] focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 h-10 rounded-md bg-white border border-border/40 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Filter size={16} />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 h-10 rounded-md bg-white border border-border/40 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sort by: Date
          </button>
        </div>
      </div>
      
      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="glass-card group flex flex-col p-6 rounded-xl hover:ring-1 hover:ring-primary/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                project.status === "In Progress" && "bg-blue-50 text-blue-600",
                project.status === "On Hold" && "bg-orange-50 text-orange-600",
                project.status === "Completed" && "bg-green-50 text-green-600",
                project.status === "Planning" && "bg-gray-50 text-gray-600",
              )}>
                {project.status}
              </span>
              <button className="p-1 -mr-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-secondary transition-all">
                <MoreHorizontal size={16} />
              </button>
            </div>

            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">{project.category}</p>
            
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground">{project.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${project.progress}%` }} 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex -space-x-2">
                  {[...Array(project.team)].map((_, i) => (
                    <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                  <Clock size={12} />
                  {project.deadline}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
