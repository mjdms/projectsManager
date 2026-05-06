"use client"

import { useScraper } from "@/context/ScraperContext"
import { Radar, Square, ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"

export function GlobalScraperIndicator() {
  const { isSearching, liveLeads, stopSearch } = useScraper()
  const router = useRouter()

  if (!isSearching) return null

  return (
    <div className="fixed top-5 right-6 z-[9999] animate-in slide-in-from-top-3 fade-in duration-400">
      <div className="glass-shell rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg shadow-black/5 border border-border/20">
        {/* Pulse icon */}
        <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
          <Radar size={14} className="text-primary animate-spin" style={{ animationDuration: "3s" }} />
          <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-green-500 ring-2 ring-white" />
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0">
          <p className="text-[12px] font-semibold text-foreground leading-none">Scanning in progress</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
            {liveLeads.length} lead{liveLeads.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={() => router.push("/clients?tab=finder")}
            title="View console"
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <ArrowUpRight size={14} />
          </button>
          <button
            onClick={stopSearch}
            title="Stop scan"
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <Square size={12} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  )
}
