import prisma from "@/lib/prisma"
import authAdmin from "@/middlewares/authAdmin"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

/**
 * GET /api/store/pending‑and‑rejected
 * Allows an admin to fetch all stores with status 'approved'
 */
export async function GET(request) {
  try {
    // Authenticate
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      )
    }

    // Authorization check
    const isAdminFlag = await authAdmin(userId)
    if (!isAdminFlag) {
      return NextResponse.json(
        { error: "User is not authorized to access this resource" },
        { status: 403 }
      )
    }

    // Fetch stores
    const stores = await prisma.store.findMany({
      where: {
        status: "approved",
      },
      include: { user: true }, // include user info if needed
    })

    return NextResponse.json({ stores }, { status: 200 })
  } catch (error) {
    console.error("GET /api/store/approved error:", error)

    return NextResponse.json(
      {
        error: error.code || "Internal Server Error",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}
