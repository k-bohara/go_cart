import { inngest } from "@/inngest/client"
import prisma from "@/lib/prisma"
import authAdmin from "@/middlewares/authAdmin"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Add new coupon
export async function POST(request) {
  try {
    const { userId } = await auth()
    const isAdmin = await authAdmin(userId)
    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      )
    }
    if (!isAdmin) {
      return NextResponse.json(
        { error: "User is not authorized to access this resource" },
        { status: 403 }
      )
    }
    const { coupon } = await request.json()
    coupon.code = coupon.code.toUpperCase()

    // Create the new coupon in the database
    await prisma.coupon
      .create({
        data: coupon,
      })
      .then(async (coupon) => {
        // run inngest function to delete coupon on expire
        await inngest.send({
          name: "app/coupon.expired",
          data: {
            code: coupon.code,
            expires_at: coupon.expiresAt,
          },
        })
      })
    // Return a success response
    return NextResponse.json(
      { message: "Coupon added successfully" },
      { status: 201 } // Created
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 500 }
    )
  }
}

// delete coupon /api/coupon?id=couponId
export async function DELETE(request) {
  try {
    const { userId } = await auth()
    const isAdmin = await authAdmin(userId)
    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      )
    }
    if (!isAdmin) {
      return NextResponse.json(
        { error: "User is not authorized to access this resource" },
        { status: 403 }
      )
    }
    const { searchParams } = request.nextUrl
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 } // Bad Request
      )
    }

    await prisma.coupon.delete({ where: { code } })
    return Response.json(
      { message: "Coupon added successfully" },
      { status: 200 } // OK
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 500 }
    )
  }
}

// Get all coupons

export async function GET(request) {
  try {
    const { userId } = await auth()
    const isAdmin = await authAdmin(userId)
    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      )
    }
    if (!isAdmin) {
      return NextResponse.json(
        { error: "User is not authorized to access this resource" },
        { status: 403 }
      )
    }

    const coupons = await prisma.coupon.findMany({})

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 500 }
    )
  }
}
