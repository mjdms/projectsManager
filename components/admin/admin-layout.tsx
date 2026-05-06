"use client"

import { useState, useEffect } from "react"
import { Menu, X, Search, Command } from "lucide-react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/admin/sidebar"
import { cn } from "@/lib/utils"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsCommandPaletteOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <div className="relative h-screen bg-background text-foreground sm:p-4 lg:p-8 overflow-hidden transition-all duration-300">
      
      {/* Square grid background pattern — vignette masked */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 35%, black 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 35%, black 80%)',
        }}
      />

      {/* Ambient gradient blobs for glass to blur */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-400/15 blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-300/20 blur-[120px]" />
        <div className="absolute top-1/4 right-10 w-[300px] h-[300px] rounded-full bg-sky-300/15 blur-[80px]" />
      </div>

      {/* Command Palette Mock */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-md" onClick={() => setIsCommandPaletteOpen(false)} />
          <div className="relative w-full max-w-xl glass-card rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 py-3 border-b border-white/30">
              <Search className="h-4 w-4 text-muted-foreground mr-3" />
              <input 
                autoFocus
                type="text" 
                placeholder="Type a command or search..." 
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <div className="px-1.5 py-0.5 rounded border border-border/40 text-[9px] font-bold text-muted-foreground uppercase">Esc</div>
            </div>
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Suggestions</div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/30 cursor-pointer text-sm transition-colors">
                <Command className="h-4 w-4 text-muted-foreground" />
                <span>Go to Projects</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/30 cursor-pointer text-sm transition-colors">
                <Command className="h-4 w-4 text-muted-foreground" />
                <span>Switch to Team</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Window shell */}
      <div className={cn(
        "relative flex flex-col mx-auto w-full max-w-[1600px] h-full overflow-hidden transition-all duration-500",
        "glass-shell sm:rounded-2xl border-none rounded-none"
      )}>

        {/* Desktop Header bar */}
        <div className="hidden lg:flex relative shrink-0 items-center justify-center w-full h-10 bg-transparent">
          <div className="absolute left-6 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" aria-hidden />
          </div>
          
          {/* Address bar */}
          <div className="flex items-center justify-center px-6 py-1.5 rounded-full bg-white border border-border/20 text-[10px] font-mono text-foreground/60 tracking-tight select-none">
            saas.app{pathname === "/" ? "/dashboard" : pathname}
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex lg:hidden shrink-0 items-center justify-between px-6 py-4 bg-transparent absolute top-4 left-6 z-50">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-sm border border-border/10 text-foreground transition-all hover:scale-105 active:scale-95"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 relative overflow-hidden">
          
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl transition-transform duration-500 lg:static lg:w-64 lg:translate-x-0 lg:bg-transparent lg:backdrop-blur-none",
            isSidebarOpen ? "translate-x-0 border-r border-border/10" : "-translate-x-full"
          )}>
            <Sidebar onSearchClick={() => setIsCommandPaletteOpen(true)} />
          </div>

          {/* Main Content Area */}
          <main className="no-scrollbar flex-1 min-w-0 overflow-y-auto px-6 sm:px-8 py-8 sm:py-10 bg-transparent lg:border-l lg:border-t lg:border-border/20 lg:rounded-tl-2xl">
            <div className="flex flex-col gap-12 max-w-5xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
