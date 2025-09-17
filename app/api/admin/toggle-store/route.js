import prisma from "@/lib/prisma"
import authAdmin from "@/middlewares/authAdmin"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// toggle store isActive
export async function POST(request) {
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
    const isAdmin = await authAdmin(userId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "User is not authorized to access this resource" },
        { status: 403 }
      )
    }

    // Fetch stores
    const { storeId } = await request.json()

    if (!storeId) {
      return NextResponse.json({ error: "Missing storeId" }, { status: 400 })
    }

    // find the store
    const store = await prisma.store.findUnique({ where: { id: storeId } })

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 400 })
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { isActive: !store.isActive },
    })

    return NextResponse.json(
      { message: "Store updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: error.code || "Internal Server Error",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}
