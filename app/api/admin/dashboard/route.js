import prisma from "@/lib/prisma"
import authAdmin from "@/middlewares/authAdmin"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

/**
 * GET /api/admin/dashboard
 * Returns dashboard data for admin:
 *  - total orders count
 *  - total stores count
 *  - total products count
 *  - total revenue from orders
 *  - optionally recent orders summary (with createdAt & total)
 */
export async function GET(request) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      )
    }

    // Authorization: must be admin
    const isAdmin = await authAdmin(userId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "User is not authorized to access this resource" },
        { status: 403 }
      )
    }

    // Get counts using Prisma
    const [ordersCount, storesCount, productsCount] = await Promise.all([
      prisma.order.count(),
      prisma.store.count(),
      prisma.product.count(),
    ])

    // Get total revenue (sum of order totals) via aggregate
    const revenueResult = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
    })

    const totalRevenueNum = revenueResult._sum.total ?? 0
    // Format revenue, e.g., to 2 decimals
    const revenue = parseFloat(totalRevenueNum.toFixed(2))

    const dashboardData = {
      orders: ordersCount,
      stores: storesCount,
      products: productsCount,
      revenue,
    }

    return NextResponse.json({ dashboardData }, { status: 200 })
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error)

    return NextResponse.json(
      {
        error: error.code || "Internal Server Error",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}
