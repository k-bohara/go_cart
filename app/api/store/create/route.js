import imagekit from "@/configs/imagekit"
import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

/**
 * POST /api/store
 * Create a new store for the authenticated user
 */
export async function POST(request) {
  try {
    // ✅ Authenticate user via Clerk
    const { userId } = getAuth(request)

    // ❌ If not authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Parse multipart form data from the request
    const formData = await request.formData()

    // Extract form fields
    const name = formData.get("name")
    const username = formData.get("username")
    const description = formData.get("description")
    const email = formData.get("email")
    const contact = formData.get("contact")
    const address = formData.get("address")
    const image = formData.get("image")

    // ❌ Validate required fields
    if (!name || !username || !description || !contact || !address || !image) {
      return NextResponse.json(
        { error: "Missing store information" },
        { status: 400 }
      )
    }

    // ✅ Check if user already has a registered store
    const existingStore = await prisma.store.findFirst({
      where: { userId },
    })

    if (existingStore) {
      // 🟡 Return current store status (e.g., 'approved', 'pending', etc.)
      return NextResponse.json(
        { message: "Store already registered", status: existingStore.status },
        { status: 200 }
      )
    }

    // ✅ Check if username is already taken (case-insensitive)
    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: username.toLowerCase() },
    })

    if (isUsernameTaken) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 } // Conflict
      )
    }

    // ✅ Upload store logo to ImageKit
    const buffer = Buffer.from(await image.arrayBuffer())
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos",
    })

    // ✅ Generate optimized image URL
    const optimisedImage = imagekit.url({
      path: uploadResponse.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    })

    // ✅ Create new store in database
    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        address,
        contact,
        logo: optimisedImage,
      },
    })

    // ✅ Link store to user (if user has a store relation field)
    await prisma.user.update({
      where: { id: userId },
      data: { store: { connect: { id: newStore.id } } },
    })

    return NextResponse.json(
      { message: "Store application submitted. Waiting for approval." },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Error creating store:", error)
    return NextResponse.json(
      { error: error.code || error.message || "Failed to create store" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/store
 * Check if the authenticated user has already registered a store
 */
export async function GET(request) {
  try {
    const { userId } = getAuth(request)

    // ❌ If user is not authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Check if store exists for user
    const store = await prisma.store.findFirst({
      where: { userId },
    })

    if (store) {
      // ✅ Return current store status
      return NextResponse.json(
        { message: "Store registered", status: store.status },
        { status: 200 }
      )
    }

    // ✅ No store registered
    return NextResponse.json(
      { message: "Store not registered", status: "not_registered" },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Error checking store:", error)
    return NextResponse.json(
      { error: error.code || error.message || "Failed to check store" },
      { status: 500 }
    )
  }
}
