import { EventEmitter } from "events"
import { extractLeadsFromMap } from "./scraper"
import prisma from "./prisma"

interface ScraperJob {
  isSearching: boolean;
  logs: string[];
  liveLeads: any[];
  startTime: number | null;
  params: { lat: number; lng: number; radius: number } | null;
}

const g = global as unknown as { scraperJob: ScraperJob; scraperEmitter: EventEmitter }

if (!g.scraperJob) {
  g.scraperJob = { isSearching: false, logs: [], liveLeads: [], startTime: null, params: null }
}

if (!g.scraperEmitter) {
  g.scraperEmitter = new EventEmitter()
  g.scraperEmitter.setMaxListeners(50)
}

export const scraperEvents = g.scraperEmitter

function pushLog(msg: string) {
  g.scraperJob.logs.push(msg)
  if (g.scraperJob.logs.length > 500) g.scraperJob.logs.shift()
  g.scraperEmitter.emit("log", msg)
}

export const scraperManager = {
  getJob: () => g.scraperJob,

  start: async (lat: number, lng: number, radius: number, keywords: string, maxLeads: number, searchMode: string) => {
    if (g.scraperJob.isSearching) return

    g.scraperJob = {
      isSearching: true,
      logs: [],
      liveLeads: [],
      startTime: Date.now(),
      params: { lat, lng, radius }
    }
    g.scraperEmitter.emit("status", true)
    pushLog(`[SYSTEM] Starting job in ${searchMode} mode (Limit: ${maxLeads} leads)...`)

    try {
      await prisma.scannedArea.create({ data: { lat, lng, radius } })

      await extractLeadsFromMap(
        lat, lng, radius, keywords, searchMode,
        (msg) => pushLog(msg),
        (lead) => {
          const idx = g.scraperJob.liveLeads.findIndex(l => l.url === lead.url)
          if (idx !== -1) {
            g.scraperJob.liveLeads[idx] = lead
          } else {
            g.scraperJob.liveLeads.unshift(lead)
          }
          g.scraperEmitter.emit("lead", lead)
        },
        maxLeads
      ).then(async (leads) => {
        if (leads.length > 0) {
          pushLog(`[SYSTEM] Saving ${leads.length} leads to database...`)
          await fetch("http://localhost:3000/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leads)
          })
        }
        g.scraperJob.isSearching = false
        pushLog("[SYSTEM] Job completed successfully.")
        g.scraperEmitter.emit("status", false)
      })
    } catch (error: any) {
      g.scraperJob.isSearching = false
      pushLog(`[ERROR] Job failed: ${error.message}`)
      g.scraperEmitter.emit("status", false)
    }
  },

  stop: () => {
    g.scraperJob.isSearching = false
    pushLog("[SYSTEM] Job stopped by user.")
    g.scraperEmitter.emit("status", false)
  }
}
