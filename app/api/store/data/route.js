import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * GET /api/store?username=example
 * Fetches store info and its in-stock products (with ratings) by username
 */
export async function GET(request) {
  try {
    // ✅ Extract store username from query params
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")?.toLowerCase()

    // ❌ If no username provided
    if (!username) {
      return NextResponse.json(
        { error: "Missing required query parameter: username" },
        { status: 400 }
      )
    }

    // ✅ Fetch store info and only in-stock products with their ratings
    const store = await prisma.store.findUnique({
      where: { username, isActive: true },
      include: {
        Product: {
          include: { rating: true },
        },
      },
    })

    // ❌ Store not found or inactive
    if (!store) {
      return NextResponse.json(
        { error: "Store not found or is inactive" },
        { status: 404 }
      )
    }

    // ✅ Return store and its products
    return NextResponse.json({ store }, { status: 200 })
  } catch (error) {
    console.error("❌ Error fetching store and products:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
