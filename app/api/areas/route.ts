import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const areas = await prisma.scannedArea.findMany({
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(areas)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { lat, lng, radius } = await request.json()
    const area = await prisma.scannedArea.create({
      data: { lat, lng, radius }
    })
    return NextResponse.json(area)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
