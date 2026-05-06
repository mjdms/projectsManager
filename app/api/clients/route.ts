import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { website: { contains: search } }
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    })

    const totalActive = await prisma.client.count({ where: { status: "Active" } })
    const totalArchived = await prisma.client.count({ where: { status: "Archived" } })
    const totalReview = await prisma.client.count({ where: { status: "Review" } })
    
    return NextResponse.json({ 
      data: clients, 
      counts: { Active: totalActive, Archived: totalArchived, Review: totalReview } 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json()
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 })
    }
    
    await prisma.client.deleteMany({
      where: { id: { in: ids } }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Support batch upsert (for extraction results) or single
    if (Array.isArray(data)) {
      const results = await Promise.all(
        data.map(client => 
          prisma.client.upsert({
            where: { url: client.url },
            update: {
              status: client.status || "Review",
              score: client.score
            },
            create: {
              title: client.title,
              website: client.website,
              rating: client.rating,
              phone: client.phone,
              url: client.url,
              score: client.score,
              status: client.status || "Review",
              type: client.type
            }
          })
        )
      )
      return NextResponse.json(results)
    }

    const client = await prisma.client.create({ data })
    return NextResponse.json(client)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
