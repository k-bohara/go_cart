import { getAuth } from "@clerk/nextjs/server"
import imagekit from "@/configs/imagekit"
import authSeller from "@/middlewares/authSeller" // Middleware to check if user is a seller
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    // ✅ Get authenticated user ID
    const { userId } = getAuth(request)

    // ❌ If user is not authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Check if user is a verified seller and get their store ID
    const storeId = await authSeller(userId)

    // ❌ If not authorized to add product
    if (!storeId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // ✅ Parse the form data from the request (multipart/form-data)
    const formData = await request.formData()

    // 📦 Extract individual form fields
    const name = formData.get("name")
    const description = formData.get("description")
    const mrp = Number(formData.get("mrp")) // Convert to number
    const price = Number(formData.get("price")) // Convert to number
    const category = formData.get("category")
    const images = formData.getAll("images") // Returns array of File objects

    // ❌ Validate required fields
    if (
      !name ||
      !description ||
      !mrp ||
      !price ||
      !category ||
      images.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing product details" },
        { status: 400 }
      )
    }

    // ❌ Ensure all uploaded items are valid File objects
    const invalidImage = images.some((image) => !(image instanceof File))
    if (invalidImage) {
      return NextResponse.json(
        { error: "Invalid image file(s)" },
        { status: 400 }
      )
    }

    // ✅ Upload all images to ImageKit and optimize them
    const imagesUrl = await Promise.all(
      images.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer()) // Convert file to buffer
        const response = await imagekit.upload({
          file: buffer,
          fileName: image.name,
          folder: "products",
        })

        // Generate optimized URL with transformations
        return imagekit.url({
          path: response.filePath,
          transformation: [
            { quality: "auto" },
            { format: "webp" },
            { width: "1024" },
          ],
        })
      })
    )

    // ✅ Save the new product to the database
    await prisma.product.create({
      data: {
        name,
        description,
        mrp,
        price,
        category,
        images: imagesUrl,
        storeId,
      },
    })

    // ✅ Return success response
    return NextResponse.json(
      { message: "Product added successfully" },
      { status: 201 }
    )
  } catch (error) {
    // ❌ Handle unexpected server errors
    console.error("❌ Error adding product:", error)
    return NextResponse.json(
      { error: error?.message || "Something went wrong" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/products
 * Get all products belonging to the authenticated seller
 */
export async function GET(request) {
  try {
    // ✅ Get authenticated user ID via Clerk
    const { userId } = getAuth(request)

    // ❌ If user is not authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Check if the user is a verified seller and retrieve store ID
    const storeId = await authSeller(userId)

    // ❌ If user is not an authorized seller
    if (!storeId) {
      return NextResponse.json(
        { error: "Forbidden: Seller access only" },
        { status: 403 }
      )
    }

    // ✅ Fetch all products that belong to this store
    const products = await prisma.product.findMany({
      where: { storeId },
    })

    // ✅ Return products array (can be empty)
    return NextResponse.json({ products }, { status: 200 })
  } catch (error) {
    console.error("❌ Error fetching seller products:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to fetch products" },
      { status: 500 }
    )
  }
}
