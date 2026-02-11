"use client"

import { SidebarNavOpenProvider } from "@/contexts/sidebar-nav-open"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { navMainConfig } from "@/lib/navigation"

interface AppShellProps {
  children: React.ReactNode
  user?: { name: string; email: string; avatar?: string }
  signOutForm: React.ReactNode
}

export function AppShell({ children, user, signOutForm }: AppShellProps) {
  return (
    <SidebarNavOpenProvider items={navMainConfig}>
      <SidebarProvider>
        <AppSidebar user={user} signOutForm={signOutForm} />
        <SidebarInset>
          <AppHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SidebarNavOpenProvider>
  )
}
