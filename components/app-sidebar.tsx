"use client"

import * as React from "react"
import {
  BarChart3,
  Calendar,
  Megaphone,
  Plug2,
  Settings2,
  type LucideIcon,
  Users,
} from "lucide-react"

import { LayoutDashboard } from "@/components/animate-ui/icons/layout-dashboard"
import { AnimateIcon } from "@/components/animate-ui/icons/icon"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { navMainConfig } from "@/lib/navigation"

const navMainIcons: Record<string, LucideIcon> = {
  Campaigns: Megaphone,
  Creators: Users,
  Content: Calendar,
  Integrations: Plug2,
  Settings: Settings2,
}

function DashboardIcon() {
  return (
    <AnimateIcon animateOnHover>
      <LayoutDashboard size={16} />
    </AnimateIcon>
  )
}

const navMain = navMainConfig.map((item) => ({
  ...item,
  icon:
    item.title === "Dashboard"
      ? (DashboardIcon as unknown as LucideIcon)
      : (navMainIcons[item.title] ?? Settings2),
  isActive: item.title === "Dashboard",
}))

const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/placeholder.svg",
  },
  teams: [
    {
      name: "My Agency",
      plan: "Agency",
    },
  ],
  navMain,
  projects: [
    { name: "Instagram", url: "/integrations/instagram", icon: BarChart3 },
    { name: "TikTok", url: "/integrations/tiktok", icon: BarChart3 },
  ],
}

const defaultUser = data.user

export function AppSidebar({
  user: userProp,
  signOutForm,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: { name: string; email: string; avatar?: string }
  signOutForm?: React.ReactNode
}) {
  const user = {
    name: userProp?.name ?? defaultUser.name,
    email: userProp?.email ?? defaultUser.email,
    avatar: userProp?.avatar ?? defaultUser.avatar,
  }
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} signOutForm={signOutForm} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
