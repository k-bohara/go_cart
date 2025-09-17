// Approve Seller & List Pending/Rejected Stores Endpoints

import prisma from "@/lib/prisma"
import authAdmin from "@/middlewares/authAdmin"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

/**
 * POST /api/store/approve
 * Allows an admin to approve or reject a seller/store.
 */
export async function POST(request) {
  try {
    // Get authentication data (App Router context)
    const { userId } = await auth()

    // If user is not signed in, respond 401 Unauthorized
    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      )
    }

    // Check if this userId is an admin
    const isAdminFlag = await authAdmin(userId)
    if (!isAdminFlag) {
      // 403 Forbidden: user is authenticated but lacks privileges
      return NextResponse.json(
        { error: "User is not authorized to perform this action" },
        { status: 403 }
      )
    }

    // Parse JSON body
    const body = await request.json()

    // Validate required parameters
    const { storeId, status } = body

    if (!status || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json(
        {
          error:
            "Invalid or missing 'status'. Must be 'approved' or 'rejected'",
        },
        { status: 400 }
      )
    }

    // Perform the update depending on status
    if (status === "approved") {
      await prisma.store.update({
        where: { id: storeId },
        data: { status: "approved", isActive: true },
      })
    } else {
      // status === "rejected"
      await prisma.store.update({
        where: { id: storeId },
        data: { status: "rejected", isActive: false },
      })
    }

    // Success response
    return NextResponse.json(
      { message: `Store ${status} successfully` },
      { status: 200 }
    )
  } catch (error) {
    console.error("POST /api/store/approve error:", error)

    // Prisma known error: e.g. record not found
    if (error.code === "P2025") {
      // P2025: record to update not found
      return NextResponse.json(
        {
          error: "Store not found",
          message: "No store matches the provided storeId",
        },
        { status: 404 }
      )
    }

    // Default internal server error
    return NextResponse.json(
      {
        error: error.code || "Internal Server Error",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/store/pending‑and‑rejected
 * Allows an admin to fetch all stores with status 'pending' or 'rejected'
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
        status: { in: ["pending", "rejected"] },
      },
      include: { user: true }, // include user info if needed
    })

    return NextResponse.json({ stores }, { status: 200 })
  } catch (error) {
    console.error("GET /api/store/pending‑and‑rejected error:", error)

    return NextResponse.json(
      {
        error: error.code || "Internal Server Error",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}
