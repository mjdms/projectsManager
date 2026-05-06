"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"

interface Client {
  id: string
  title: string
  website: string
  rating: number
  phone: string
  url: string
  score: number
  status: "Active" | "Archived" | "Pending" | "Review"
  type: string
  createdAt: number
}

interface ScannedArea {
  id: string
  lat: number
  lng: number
  radius: number
  createdAt: string
}

interface ScraperContextType {
  isSearching: boolean
  logs: string[]
  extractedLeads: Client[]
  liveLeads: Client[]
  scannedAreas: ScannedArea[]
  startSearch: (lat: number, lng: number, radius: number, maxLeads: number, keywords?: string, searchMode?: string) => Promise<void>
  stopSearch: () => void
  clearLogs: () => void
  setLogs: React.Dispatch<React.SetStateAction<string[]>>
}

const ScraperContext = createContext<ScraperContextType | undefined>(undefined)

export function ScraperProvider({ children }: { children: React.ReactNode }) {
  const [isSearching, setIsSearching] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [extractedLeads] = useState<Client[]>([])
  const [liveLeads, setLiveLeads] = useState<Client[]>([])
  const [scannedAreas, setScannedAreas] = useState<ScannedArea[]>([])
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    fetchAreas()
    connect()
    return () => {
      esRef.current?.close()
    }
  }, [])

  function connect() {
    if (esRef.current) esRef.current.close()

    const es = new EventSource("/api/extract/stream")
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)

        if (data.type === "init") {
          // Full state snapshot on connect/reconnect
          setIsSearching(data.isSearching)
          setLogs(data.logs ?? [])
          setLiveLeads(data.leads ?? [])
        } else if (data.type === "log") {
          // Append single log — no full array replacement, no jumping
          setLogs(prev => [...prev, data.message])
        } else if (data.type === "lead") {
          setLiveLeads(prev => {
            const idx = prev.findIndex(l => l.url === data.lead.url)
            if (idx !== -1) {
              const next = [...prev]
              next[idx] = data.lead
              return next
            }
            return [data.lead, ...prev]
          })
        } else if (data.type === "status") {
          setIsSearching(data.isSearching)
          if (!data.isSearching) fetchAreas()
        }
      } catch {}
    }

    es.onerror = () => {
      // Auto-reconnect after 3s on error
      es.close()
      setTimeout(() => connect(), 3000)
    }
  }

  const fetchAreas = async () => {
    try {
      const res = await fetch("/api/areas")
      const data = await res.json()
      if (Array.isArray(data)) setScannedAreas(data)
    } catch {}
  }

  const clearLogs = () => {
    setLogs([])
    setLiveLeads([])
  }

  const stopSearch = async () => {
    await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" })
    })
  }

  const startSearch = async (lat: number, lng: number, radius: number, maxLeads: number, keywords: string = "", searchMode: string = "Standard") => {
    setLogs([])
    setLiveLeads([])
    try {
      await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, radius, maxLeads, keywords, searchMode })
      })
      fetchAreas()
    } catch {}
  }

  return (
    <ScraperContext.Provider value={{
      isSearching, logs, extractedLeads, liveLeads, scannedAreas,
      startSearch, stopSearch, clearLogs, setLogs
    }}>
      {children}
    </ScraperContext.Provider>
  )
}

export function useScraper() {
  const context = useContext(ScraperContext)
  if (context === undefined) throw new Error("useScraper must be used within a ScraperProvider")
  return context
}
