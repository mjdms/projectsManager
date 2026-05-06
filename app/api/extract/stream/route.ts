import { scraperManager, scraperEvents } from "@/lib/scraper-manager"

export async function GET(request: Request) {
  const encoder = new TextEncoder()

  let onLog: ((msg: string) => void) | null = null
  let onLead: ((lead: any) => void) | null = null
  let onStatus: ((v: boolean) => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      // Immediately send current state (catch-up for reconnects)
      const job = scraperManager.getJob()
      send({ type: "init", logs: job.logs, leads: job.liveLeads, isSearching: job.isSearching })

      onLog = (msg: string) => send({ type: "log", message: msg })
      onLead = (lead: any) => send({ type: "lead", lead })
      onStatus = (isSearching: boolean) => send({ type: "status", isSearching })

      scraperEvents.on("log", onLog)
      scraperEvents.on("lead", onLead)
      scraperEvents.on("status", onStatus)
    },
    cancel() {
      if (onLog) scraperEvents.off("log", onLog)
      if (onLead) scraperEvents.off("lead", onLead)
      if (onStatus) scraperEvents.off("status", onStatus)
    }
  })

  request.signal.addEventListener("abort", () => {
    if (onLog) scraperEvents.off("log", onLog)
    if (onLead) scraperEvents.off("lead", onLead)
    if (onStatus) scraperEvents.off("status", onStatus)
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  })
}
