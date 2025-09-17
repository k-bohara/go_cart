import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import authSeller from "@/middlewares/authSeller"

/**
 * POST /api/product/toggle-stock
 * Toggle the stock status (inStock) of a product owned by the seller
 */
export async function POST(request) {
  try {
    // ✅ Get authenticated user via Clerk
    const { userId } = getAuth(request)

    // ❌ Not authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Parse request body
    const { productId } = await request.json()

    // ❌ Missing productId in request
    if (!productId) {
      return NextResponse.json(
        { error: "Missing required field: productId" },
        { status: 400 }
      )
    }

    // ✅ Check if user is a seller and get their storeId
    const storeId = await authSeller(userId)

    // ❌ User is not a seller
    if (!storeId) {
      return NextResponse.json(
        { error: "Forbidden: Seller access only" },
        { status: 403 }
      )
    }

    // ✅ Check if the product exists and belongs to the seller
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
      },
    })

    // ❌ Product not found or doesn't belong to seller
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // ✅ Toggle stock status
    await prisma.product.update({
      where: { id: productId },
      data: { inStock: !product.inStock },
    })

    // ✅ Return success message
    return NextResponse.json(
      { message: "Product stock updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Error toggling stock:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
