import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import authSeller from "@/middlewares/authSeller"
import prisma from "@/lib/prisma"

/**
 * GET /api/auth/seller
 * Verifies if the user is a seller and returns their store info.
 */
export async function GET(request) {
  try {
    // ✅ Get authenticated user ID
    const { userId } = getAuth(request)

    // ❌ If user is not authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Check if user is a verified seller
    const isSeller = await authSeller(userId)

    // ❌ If user is not a seller
    if (!isSeller) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // ✅ Get store information for the seller
    const storeInfo = await prisma.store.findUnique({
      where: { userId },
    })

    return NextResponse.json({ isSeller: true, storeInfo }, { status: 200 })
  } catch (error) {
    console.error(
      "❌ Failed to verify seller authentication in /api/auth/seller",
      error
    )
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
