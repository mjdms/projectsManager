import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { AdminLayout } from "@/components/admin/admin-layout"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Saas — Project Manager",
  description: "Manage your projects, teams and tasks in one place.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <AdminLayout>
          {children}
        </AdminLayout>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
