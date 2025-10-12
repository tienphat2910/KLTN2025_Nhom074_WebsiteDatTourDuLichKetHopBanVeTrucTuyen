"use client"

import { ReactNode } from "react"
import { AdminSidebar } from "./AdminSidebar"
import { AdminHeader } from "./AdminHeader"

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader title={title} breadcrumbs={breadcrumbs} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}