import { NextResponse } from "next/server"
import { scraperManager } from "@/lib/scraper-manager"

export async function GET() {
  const job = scraperManager.getJob()
  return NextResponse.json(job)
}

export async function POST(request: Request) {
  try {
    const { lat, lng, radius, keywords, maxLeads, action, searchMode } = await request.json()

    if (action === "stop") {
      scraperManager.stop()
      return NextResponse.json({ success: true })
    }

    if (!lat || !lng || !radius) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // Start background job (non-blocking)
    scraperManager.start(
      lat, 
      lng, 
      radius, 
      keywords ?? "restaurants", 
      maxLeads || 50, 
      searchMode || "Standard"
    )

    return NextResponse.json({ success: true, message: "Job started in background" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
