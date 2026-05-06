"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Search, Building2, ExternalLink, Map as MapIcon, Star, Phone, Globe,
  CheckCircle2, MapPin, Radar, Trash2, Archive, UserCheck,
  RotateCcw, Sparkles, ChevronLeft, X, Loader2, TrendingUp, AlertCircle,
  ScrollText, CircleDot, ThumbsUp, ThumbsDown, ClipboardCheck, ArrowLeft, ArrowRight,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { useScraper } from "@/context/ScraperContext"
import { useSearchParams } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"

const MapPicker = dynamic(() => import("@/components/admin/map-picker").then(m => m.MapPicker), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full rounded-xl bg-secondary/30 animate-pulse" />
})

interface Client {
  id: string
  title: string
  website: string | null
  rating: number | null
  phone: string | null
  url: string
  score: number
  status: "Active" | "Archived" | "Pending" | "Review"
  type: string | null
  opinionCount: number | null
  category: string | null
  address: string | null
  createdAt: number
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-green-600 bg-green-50" : score >= 40 ? "text-orange-600 bg-orange-50" : "text-red-600 bg-red-50"
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums", color)}>
      <TrendingUp size={9} /> {score}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn(
      "h-1.5 w-1.5 rounded-full shrink-0",
      status === "Active" ? "bg-green-500" :
      status === "Review" ? "bg-amber-500 animate-pulse" :
      status === "Pending" ? "bg-blue-500 animate-pulse" :
      "bg-muted-foreground/30"
    )} />
  )
}

export default function ClientsPage() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<"list" | "review" | "finder">("list")
  const [filter, setFilter] = useState<"Active" | "Archived">("Active")
  const [selected, setSelected] = useState<Client | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [counts, setCounts] = useState({ Active: 0, Archived: 0, Review: 0 })
  const [search, setSearch] = useState("")
  const [reviewIdx, setReviewIdx] = useState(0)
  const [reviewAnim, setReviewAnim] = useState<"" | "left" | "right">("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(p => p + 1)
      }
    })
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore])

  const { isSearching, logs, liveLeads, startSearch, setLogs } = useScraper()
  const logContainerRef = useRef<HTMLDivElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchClients() }, [])

  // Sync tab from URL — so ?tab=finder from router.push works
  useEffect(() => {
    const t = searchParams.get("tab")
    if (t === "finder" || t === "review" || t === "list") setTab(t)
  }, [searchParams])

  // Scroll to bottom when entering finder tab
  useEffect(() => {
    if (tab === "finder") {
      setTimeout(() => {
        logEndRef.current?.scrollIntoView({ behavior: "instant" })
      }, 50)
    }
  }, [tab])

  // Smart auto-scroll: only follow if already near the bottom
  useEffect(() => {
    const el = logContainerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 250
    if (isNearBottom || logs.length < 10) {
      setTimeout(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 10)
    }
  }, [logs])

  const fetchClients = async (isNewSearch = false) => {
    if (loading || (tab === "list" && !hasMore && !isNewSearch)) return
    setLoading(true)
    try {
      const currentPage = isNewSearch ? 1 : page
      const statusParam = tab === "list" ? filter : tab === "review" ? "Review" : ""
      const limitParam = tab === "review" ? 100 : 10
      const res = await fetch(`/api/clients?page=${currentPage}&limit=${limitParam}&search=${search}&status=${statusParam}`)
      const resData = await res.json()
      if (resData && Array.isArray(resData.data)) {
        const data = resData.data
        if (isNewSearch) {
          setClients(data)
          setPage(1)
        } else {
          setClients(prev => {
            const existingIds = new Set(prev.map(c => c.id))
            const uniqueData = data.filter((c: Client) => !existingIds.has(c.id))
            return [...prev, ...uniqueData]
          })
        }
        setCounts(resData.counts)
        setHasMore(data.length === 10)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients(true)
    setSelectedIds(new Set())
    setSelected(null)
  }, [filter, search, tab])

  useEffect(() => {
    if (page > 1) fetchClients()
  }, [page])

  const handleStart = async (lat: number, lng: number, radius: number, maxLeads: number, keywords: string, searchMode: string) => {
    if (isSearching) return
    setShowMap(false)
    await startSearch(lat, lng, radius, maxLeads, keywords, searchMode)
    await fetchClients()
  }

  const archive = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
    setCounts(prev => ({ ...prev, Active: prev.Active - 1, Archived: prev.Archived + 1 }))
    setSelected(null)
    await fetch(`/api/clients/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Archived" }) })
  }

  const restore = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
    setCounts(prev => ({ ...prev, Active: prev.Active + 1, Archived: prev.Archived - 1 }))
    setSelected(null)
    await fetch(`/api/clients/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Active" }) })
  }

  const remove = async (id: string) => {
    const client = clients.find(c => c.id === id)
    if (client) {
      setCounts(prev => ({ ...prev, [client.status]: prev[client.status as keyof typeof prev] - 1 }))
    }
    setClients(prev => prev.filter(c => c.id !== id))
    setSelected(null)
    await fetch(`/api/clients/${id}`, { method: "DELETE" })
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} clients?`)) return
    
    const idsToDelete = Array.from(selectedIds)
    setClients(prev => prev.filter(c => !selectedIds.has(c.id)))
    setSelectedIds(new Set())
    setSelected(null)
    
    await fetch("/api/clients", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: idsToDelete })
    })
    await fetchClients(true)
  }

  const handleClearReviews = async () => {
    if (!confirm("Are you sure you want to delete ALL leads in the review queue?")) return
    try {
      const res = await fetch(`/api/clients?page=1&limit=10000&status=Review`)
      const resData = await res.json()
      if (resData && Array.isArray(resData.data)) {
        const idsToDelete = resData.data.map((c: Client) => c.id)
        if (idsToDelete.length === 0) return
        
        setClients(prev => prev.filter(c => c.status !== "Review"))
        if (selected?.status === "Review") setSelected(null)
        
        await fetch("/api/clients", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: idsToDelete })
        })
        await fetchClients(true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = async () => {
    const totalCount = filter === "Active" ? counts.Active : filter === "Archived" ? counts.Archived : counts.Review
    
    if (selectedIds.size === totalCount && totalCount > 0) {
      setSelectedIds(new Set())
    } else {
      if (filtered.length < totalCount) {
        setLoading(true)
        try {
          const res = await fetch(`/api/clients?page=1&limit=10000&search=${search}&status=${filter}`)
          const resData = await res.json()
          if (resData && Array.isArray(resData.data)) {
            setClients(prev => {
              // Create a map to ensure no duplicates, though the server shouldn't return them if we just overwrite, 
              // but it's safer to just set the new full list.
              return resData.data
            })
            setSelectedIds(new Set(resData.data.map((c: Client) => c.id)))
            setHasMore(false)
          }
        } catch (e) {
          console.error("Failed to fetch all clients", e)
        } finally {
          setLoading(false)
        }
      } else {
        setSelectedIds(new Set(filtered.map(c => c.id)))
      }
    }
  }

  const reviewQueue = clients
    .filter(c => c.status === "Review")
    .sort((a, b) => (b.score || 0) - (a.score || 0))
  const currentLead = reviewQueue[reviewIdx] ?? null

  const approveReview = useCallback(async () => {
    if (!currentLead) return
    setReviewAnim("right")
    await fetch(`/api/clients/${currentLead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Active" }) })
    setTimeout(() => {
      setClients(prev => prev.filter(c => c.id !== currentLead?.id))
      setCounts(prev => ({ ...prev, Review: Math.max(0, prev.Review - 1), Active: prev.Active + 1 }))
      setReviewIdx(i => Math.max(0, i))
      setReviewAnim("")
    }, 300)
  }, [currentLead])

  const skipReview = useCallback(async () => {
    if (!currentLead) return
    setReviewAnim("left")
    await fetch(`/api/clients/${currentLead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Archived" }) })
    setTimeout(() => {
      setClients(prev => prev.filter(c => c.id !== currentLead?.id))
      setCounts(prev => ({ ...prev, Review: Math.max(0, prev.Review - 1), Archived: prev.Archived + 1 }))
      setReviewIdx(i => Math.max(0, i))
      setReviewAnim("")
    }, 300)
  }, [currentLead])

  useEffect(() => {
    if (tab !== "review") return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") approveReview()
      if (e.key === "ArrowLeft") skipReview()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [tab, approveReview, skipReview])

  const filtered = clients.filter(c =>
    c.status === filter
  )

  const activeCount = counts.Active
  const archivedCount = counts.Archived
  const reviewCount = counts.Review

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/20">
        <div>
          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] mb-1">Lead Management</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
        </div>
        {tab === "finder" && !showMap && (
          <button
            onClick={() => setShowMap(true)}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-all shadow-sm active:scale-[0.98]"
          >
            <MapPin size={14} /> New Search Area
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-full w-fit">
        <button
          onClick={() => { setTab("list"); setShowMap(false); setFilter("Active") }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all",
            tab === "list" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users size={14} /> Active Clients
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{activeCount}</span>
        </button>
        <button
          onClick={() => setTab("review")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all",
            tab === "review" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ClipboardCheck size={14} />
          Review
          {reviewCount > 0 && (
            <span className={cn(
              "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full",
              tab === "review" ? "bg-amber-100 text-amber-700" : "bg-amber-500/10 text-amber-600"
            )}>{reviewCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab("finder")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all",
            tab === "finder" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Radar size={14} className={cn(isSearching && "animate-spin text-primary")} />
          Lead Finder
          {isSearching && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      </div>

      {/* REVIEW TAB */}
      {tab === "review" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-6">
          {reviewQueue.length === 0 ? (
            <div className="glass-card rounded-xl border border-dashed border-border/20 flex flex-col items-center justify-center text-center py-20 gap-4">
              <div className="h-16 w-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-500">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">Queue is empty</h3>
                <p className="text-[12px] text-muted-foreground mt-1 max-w-xs">All leads have been reviewed. Run a new scan to discover more prospects.</p>
              </div>
              <button
                onClick={() => setTab("finder")}
                className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-all shadow-sm active:scale-[0.98]"
              >
                <Radar size={14} /> Find New Leads
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Main review card */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Progress */}
                <div className="flex items-center justify-end">
                  <p className="text-[11px] text-muted-foreground/50 font-medium">
                    Use <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono">←</kbd> to skip · <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono">→</kbd> to approve
                  </p>
                </div>

                {currentLead && (
                  <div className={cn(
                    "glass-card rounded-2xl border border-border/10 p-8 transition-all duration-300",
                    reviewAnim === "right" && "translate-x-8 opacity-0",
                    reviewAnim === "left" && "-translate-x-8 opacity-0",
                    "transform"
                  )}>
                    {/* Lead header */}
                    <div className="flex items-start gap-5 mb-8">
                      <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                        <Building2 size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-foreground leading-tight truncate">{currentLead.title}</h2>
                        <p className="text-[12px] text-muted-foreground mt-1">{currentLead.type || "Business"}</p>
                      </div>
                      <div className="shrink-0">
                        <ScoreBadge score={currentLead.score} />
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <div className="rounded-xl bg-secondary/40 p-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Rating</p>
                        <div className="flex items-center gap-1.5">
                          <Star size={16} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-[18px] font-bold text-foreground">{currentLead.rating || "—"}</span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-secondary/40 p-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Quality Score</p>
                        <div className="flex items-end gap-2">
                          <span className="text-[18px] font-bold text-foreground">{currentLead.score}</span>
                          <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden mb-1">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${currentLead.score}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-3 mb-8 border-t border-border/10 pt-6 overflow-hidden">
                      <div className="flex items-center gap-3 text-[13px] min-w-0">
                        <Globe size={15} className="text-muted-foreground/50 shrink-0" />
                        {currentLead.website
                          ? <a href={`https://${currentLead.website.replace(/^https?:\/\//, "")}`} target="_blank" className="text-primary hover:underline font-medium truncate flex-1 block">{currentLead.website}</a>
                          : <span className="text-amber-600 font-semibold truncate flex-1 block">No website — high opportunity</span>
                        }
                      </div>
                      <div className="flex items-center gap-3 text-[13px] min-w-0">
                        <Phone size={15} className="text-muted-foreground/50 shrink-0" />
                        <span className={cn("font-medium truncate flex-1 block", currentLead.phone ? "text-foreground" : "text-muted-foreground/50 italic")}>
                          {currentLead.phone || "Phone not extracted"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[13px] min-w-0">
                        <MapIcon size={15} className="text-muted-foreground/50 shrink-0" />
                        <a href={currentLead.url} target="_blank" className="text-primary hover:underline font-medium flex items-center gap-1 truncate flex-1">
                          <span className="truncate">View on Google Maps</span> <ExternalLink size={11} className="shrink-0" />
                        </a>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={skipReview}
                        className="flex items-center justify-center gap-2.5 h-12 rounded-xl border border-border/20 text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all font-semibold text-[13px] active:scale-[0.98]"
                      >
                        <ThumbsDown size={16} /> Skip
                      </button>
                      <button
                        onClick={approveReview}
                        className="flex items-center justify-center gap-2.5 h-12 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all font-semibold text-[13px] shadow-sm active:scale-[0.98]"
                      >
                        <ThumbsUp size={16} /> Approve
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Queue sidebar */}
              <div className="lg:w-72 w-full flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {reviewCount} in queue
                  </p>
                  {reviewCount > 0 && (
                    <button 
                      onClick={handleClearReviews}
                      className="text-[10px] font-semibold text-red-500/70 hover:text-red-600 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto no-scrollbar">
                  {reviewQueue.map((lead, i) => (
                    <div
                      key={lead.id}
                      onClick={() => setReviewIdx(i)}
                      className={cn(
                        "rounded-xl p-4 cursor-pointer transition-all",
                        i === reviewIdx
                          ? "bg-primary/10"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold",
                          i === reviewIdx ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                        )}>
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-foreground truncate">{lead.title}</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5 truncate">{lead.website || "No website"}</p>
                        </div>
                        <div className="w-10 flex justify-end shrink-0">
                          <ScoreBadge score={lead.score} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIST TAB */}
      {tab === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_380px] gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Table */}
          <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative group w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  type="text"
                  placeholder="Search clients..."
                  className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-border/30 text-[12px] focus:outline-none focus:border-primary/40 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-full shrink-0">
                {(["Active", "Archived"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all",
                      filter === f ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f} <span className="opacity-50 tabular-nums">{f === "Active" ? activeCount : archivedCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card list */}
            <div className="glass-card rounded-xl overflow-hidden border border-border/10">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.2em] px-5 py-3">
                <div className="flex items-center px-1">
                  <Checkbox 
                    checked={selectedIds.size === (filter === "Active" ? counts.Active : filter === "Archived" ? counts.Archived : counts.Review) && selectedIds.size > 0} 
                    onCheckedChange={toggleSelectAll}
                  />
                </div>
                <span>Client</span>
                <span className="text-center px-6">Score</span>
                <span className="text-right hidden sm:block">Added</span>
              </div>
              <div className="h-px bg-border/10" />

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <AlertCircle size={24} className="text-muted-foreground/20" />
                  <p className="text-[13px] text-muted-foreground font-medium">No {filter.toLowerCase()} clients found.</p>
                  {filter === "Active" && (
                    <button onClick={() => setTab("finder")} className="mt-2 text-[12px] font-semibold text-primary hover:underline">
                      Start a new scan →
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border/10 overflow-y-auto max-h-[calc(100vh-22rem)] no-scrollbar">
                  {filtered.map((client, index) => (
                    <div
                      key={client.id}
                      ref={index === filtered.length - 1 ? lastElementRef : null}
                      onClick={(e) => {
                        // Prevent selection when clicking checkbox or its container
                        if ((e.target as HTMLElement).closest('[data-slot="checkbox"]')) return
                        setSelected(s => s?.id === client.id ? null : client)
                      }}
                      className={cn(
                        "grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-3.5 cursor-pointer transition-colors group",
                        selected?.id === client.id ? "bg-primary/5" : "hover:bg-secondary/30"
                      )}
                    >
                      <div className="flex items-center px-1">
                        <Checkbox 
                          checked={selectedIds.has(client.id)} 
                          onCheckedChange={() => toggleSelect(client.id)}
                        />
                      </div>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          selected?.id === client.id ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground group-hover:text-foreground"
                        )}>
                          <Building2 size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[13px] font-semibold text-foreground truncate leading-none">{client.title}</p>
                            {client.category && (
                              <span className={cn(
                                "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0",
                                client.category === "NUCLEAR" ? "bg-red-500 text-white animate-pulse shadow-sm shadow-red-500/20" :
                                client.category === "HOT" ? "bg-orange-500 text-white" :
                                client.category === "WARM" ? "bg-amber-100 text-amber-700" :
                                "bg-secondary text-muted-foreground"
                              )}>{client.category}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 truncate">
                            <span>{client.website || "No website"}</span>
                            {client.opinionCount !== null && (
                              <>
                                <span>•</span>
                                <span>{client.opinionCount} reviews</span>
                              </>
                            )}
                            {client.address && (
                              <>
                                <span>•</span>
                                <span className="truncate">{client.address}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="px-6 flex justify-center">
                        <ScoreBadge score={client.score} />
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground/50 font-medium tabular-nums hidden sm:block">
                        {new Date(client.createdAt).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" })}
                      </div>
                    </div>
                  ))}
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-primary" size={20} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

          {/* Detail Panel */}
          <div>
            {selected ? (
              <div className="glass-card rounded-xl p-6 sticky top-8 flex flex-col gap-5 border border-border/10 animate-in slide-in-from-right-4 fade-in duration-300">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusDot status={selected.status} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{selected.status}</span>
                        {selected.category && (
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                            selected.category === "NUCLEAR" ? "bg-red-500 text-white animate-pulse" :
                            selected.category === "HOT" ? "bg-orange-500 text-white" :
                            selected.category === "WARM" ? "bg-amber-100 text-amber-700" :
                            "bg-secondary text-muted-foreground"
                          )}>{selected.category}</span>
                        )}
                      </div>
                      <h2 className="text-[15px] font-bold text-foreground leading-tight mt-0.5">{selected.title}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {selected.status === "Active" ? (
                      <button onClick={() => archive(selected.id)} title="Archive" className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-all">
                        <Archive size={15} />
                      </button>
                    ) : (
                      <button onClick={() => restore(selected.id)} title="Restore" className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-green-50 hover:text-green-600 transition-all">
                        <RotateCcw size={15} />
                      </button>
                    )}
                    <button onClick={() => remove(selected.id)} title="Delete" className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rating</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Star size={13} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-[15px] font-bold text-foreground">{selected.rating || "—"}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quality</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex-1 h-1 bg-border/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${selected.score}%` }} />
                      </div>
                      <span className="text-[12px] font-bold text-foreground tabular-nums">{selected.score}</span>
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="flex flex-col gap-3 border-t border-border/10 pt-4">
                  <div className="flex items-center gap-3 text-[12px] min-w-0">
                    <Globe size={14} className="text-muted-foreground/50 shrink-0" />
                    {selected.website
                      ? <a href={`https://${selected.website.replace(/^https?:\/\//, "")}`} target="_blank" className="text-primary hover:underline font-medium truncate block flex-1">{selected.website}</a>
                      : <span className="text-amber-600 font-semibold truncate block flex-1">No website</span>
                    }
                  </div>
                  <div className="flex items-center gap-3 text-[12px] min-w-0">
                    <Phone size={14} className="text-muted-foreground/50 shrink-0" />
                    <span className={cn("font-medium truncate block flex-1", selected.phone ? "text-foreground" : "text-muted-foreground/50 italic")}>
                      {selected.phone || "No phone"}
                    </span>
                  </div>
                  {(selected as any).address && (
                    <div className="flex items-center gap-3 text-[12px] min-w-0">
                      <MapPin size={14} className="text-muted-foreground/50 shrink-0" />
                      <span className="font-medium truncate block flex-1 text-foreground">
                        {(selected as any).address}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[12px] min-w-0">
                    <MapIcon size={14} className="text-muted-foreground/50 shrink-0" />
                    <a href={selected.url} target="_blank" className="text-primary hover:underline font-medium flex items-center gap-1 truncate flex-1">
                      View on Maps <ExternalLink size={10} className="shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="border-t border-border/10 pt-4 text-[11px] text-muted-foreground/50 font-medium">
                  Discovered {new Date(selected.createdAt).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-xl border border-dashed border-border/20 flex flex-col items-center justify-center text-center h-64 gap-3">
                <UserCheck size={24} className="text-muted-foreground/20" />
                <p className="text-[12px] text-muted-foreground/50 font-medium max-w-[160px]">Select a client to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINDER TAB */}
      {tab === "finder" && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {showMap ? (
            <div className="glass-card rounded-xl p-6 border border-border/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-foreground">Define Search Territory</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Drag the pin to set your target area.</p>
                  </div>
                </div>
                {(isSearching || logs.length > 0) && (
                  <button onClick={() => setShowMap(false)} className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft size={14} /> Back to Console
                  </button>
                )}
              </div>
              <MapPicker onSelect={handleStart} />
            </div>
          ) : liveLeads.length === 0 && !isSearching && logs.length === 0 ? (
            <div className="glass-card rounded-xl border border-dashed border-border/20 flex flex-col items-center justify-center text-center py-20 gap-4">
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground/40">
                <Radar size={28} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">Lead Finder Ready</h3>
                <p className="text-[12px] text-muted-foreground mt-1 max-w-xs">Pick a territory on the map and discover local business leads automatically.</p>
              </div>
              <button
                onClick={() => setShowMap(true)}
                className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-all shadow-sm active:scale-[0.98]"
              >
                <MapPin size={14} /> Start Prospecting
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
              {/* Log Panel */}
              <div className="glass-card rounded-xl overflow-hidden border border-border/10 flex flex-col h-[450px]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center">
                      <ScrollText size={13} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-foreground leading-none">Activity Log</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{logs.length} events</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isSearching && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                        <Loader2 size={11} className="animate-spin" />
                        Scanning
                      </div>
                    )}
                    <button
                      onClick={() => setLogs([])}
                      className="text-[11px] font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Log entries */}
                <div ref={logContainerRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar divide-y divide-border/10">
                  {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                      <CircleDot size={20} className="text-muted-foreground/20" />
                      <p className="text-[12px] text-muted-foreground/50 font-medium">No events yet</p>
                    </div>
                  ) : logs.map((log, i) => {
                    const tag = log.match(/^\[([A-Z]+)\]/)?.[1]
                    const rest = tag ? log.replace(`[${tag}]`, "").trim() : log
                    const tagColors: Record<string, string> = {
                      SYSTEM: "text-primary bg-primary/8",
                      ENGINE: "text-violet-600 bg-violet-50",
                      ANALYZER: "text-emerald-600 bg-emerald-50",
                      MAPS: "text-sky-600 bg-sky-50",
                      ERROR: "text-red-600 bg-red-50",
                    }
                    return (
                      <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors">
                        {tag ? (
                          <span className={cn("shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-0.5", tagColors[tag] || "text-muted-foreground bg-secondary")}>
                            {tag}
                          </span>
                        ) : (
                          <span className="shrink-0 h-1 w-1 rounded-full bg-border mt-2" />
                        )}
                        <p className="text-[12px] text-foreground/80 font-medium leading-snug flex-1 min-w-0 break-words">{rest || log}</p>
                      </div>
                    )
                  })}
                  <div ref={logEndRef} />
                </div>
              </div>

              {/* Live leads */}
              <div className="flex flex-col gap-4 h-[450px]">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sparkles size={11} className="text-primary" /> Live Extraction
                  </h3>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tabular-nums">
                    {liveLeads.length} found
                  </span>
                </div>

                <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto no-scrollbar">
                  {liveLeads.length === 0 ? (
                    <div className="glass-card rounded-xl border border-dashed border-border/10 flex flex-col items-center justify-center py-12 gap-2 opacity-50">
                      <Radar size={20} className="text-muted-foreground/30" />
                      <p className="text-[11px] text-muted-foreground font-medium">Waiting for leads...</p>
                    </div>
                  ) : liveLeads.map((lead) => (
                    <div key={lead.id} className="glass-card p-4 rounded-xl border border-border/10 hover:border-primary/20 transition-all cursor-pointer group animate-in slide-in-from-right-2 fade-in duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StatusDot status={lead.status} />
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{lead.status}</span>
                          {(lead as any).category && (
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0",
                              (lead as any).category === "NUCLEAR" ? "bg-red-500 text-white animate-pulse" :
                              (lead as any).category === "HOT" ? "bg-orange-500 text-white" :
                              (lead as any).category === "WARM" ? "bg-amber-100 text-amber-700" :
                              "bg-secondary text-muted-foreground"
                            )}>{(lead as any).category}</span>
                          )}
                        </div>
                        {lead.status !== "Pending" && (
                          <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Analyzed
                          </span>
                        )}
                      </div>
                      <h4 className="text-[13px] font-semibold text-foreground truncate">{lead.title}</h4>
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Star size={10} className="text-yellow-500 fill-yellow-500" />
                          {lead.rating || "—"}
                        </div>
                        <div className="shrink-0">
                          <ScoreBadge score={lead.score} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Floating Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 w-[calc(100%-2rem)] max-w-fit">
          <div className="glass-card rounded-xl border border-border/10 p-4 flex items-center justify-between sm:justify-start gap-4 sm:gap-6">
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-foreground">{selectedIds.size} selected</span>
              <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">Bulk actions available</span>
            </div>
            
            <div className="h-8 w-px bg-border/20 hidden sm:block" />
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-[12px] font-semibold hover:bg-red-100 transition-all"
              >
                <Trash2 size={14} /> 
                <span className="hidden sm:inline">Delete Forever</span>
                <span className="sm:hidden">Delete</span>
              </button>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 rounded-lg text-[12px] font-semibold text-muted-foreground hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
