import AdminLayout from "@/components/admin/AdminLayout"
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs"

export const metadata = {
  title: "GoCart. - Admin",
  description: "GoCart. - Admin",
}

export default function RootAdminLayout({ children }) {
  return (
    <>
      {/* Only show admin UI when user is signed in */}
      <SignedIn>
        <AdminLayout>{children}</AdminLayout>
      </SignedIn>
      {/* If signed out, show sign in page */}
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center">
          <SignIn fallbackRedirectUrl="/admin" routing="hash" />
        </div>
      </SignedOut>
    </>
  )
}
