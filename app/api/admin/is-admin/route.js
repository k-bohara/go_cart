import authAdmin from "@/middlewares/authAdmin"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    // Get authentication state; in App Router use auth()
    const { userId } = await auth()

    // If user is not signed in
    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      )
    }

    // Check if this user is an admin
    const isAdmin = await authAdmin(userId)

    // If the user is authenticated but not an admin
    if (!isAdmin) {
      return NextResponse.json(
        { error: "User is not authorized to access this resource" },
        { status: 403 }
      )
    }

    // Success: user is authenticated AND admin
    return NextResponse.json({ isAdmin: true }, { status: 200 })
  } catch (error) {
    // Log internal error for debugging
    console.error("Error in GET /auth-admin:", error)

    // Decide status code for general errors; using 500 for server errors
    return NextResponse.json(
      {
        error: error.code || "Internal Server Error",
        message: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}
