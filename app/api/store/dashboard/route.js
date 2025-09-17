import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import authSeller from "@/middlewares/authSeller"

/**
 * GET /api/seller/dashboard
 * Returns total orders, earnings, products, and ratings for the authenticated seller.
 */
export async function GET(request) {
  try {
    // ✅ Get authenticated user ID from request
    const { userId } = getAuth(request)

    // ❌ If user is not authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Verify user is a seller and get their storeId
    const storeId = await authSeller(userId)

    // ❌ If user is not a verified seller
    if (!storeId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // ✅ Fetch all orders belonging to the store
    const orders = await prisma.order.findMany({ where: { storeId } })

    // ✅ Fetch all products belonging to the store
    const products = await prisma.product.findMany({ where: { storeId } })

    // ✅ Fetch ratings for all products, including user and product info
    const ratings = await prisma.rating.findMany({
      where: {
        productId: {
          in: products.map((product) => product.id),
        },
      },
      include: {
        user: true,
        product: true,
      },
    })

    // ✅ Calculate dashboard metrics
    const dashboardData = {
      ratings,
      totalOrders: orders.length,
      totalEarnings: Math.round(
        orders.reduce((acc, order) => acc + order.total, 0)
      ),
      totalProducts: products.length,
    }

    // ✅ Return dashboard data
    return NextResponse.json({ dashboardData }, { status: 200 })
  } catch (error) {
    console.error("❌ Error fetching seller dashboard data:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
