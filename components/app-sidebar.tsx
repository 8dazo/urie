"use client"

import * as React from "react"
import {
  BarChart3,
  Calendar,
  GalleryVerticalEnd,
  LayoutDashboard,
  Megaphone,
  Settings2,
  type LucideIcon,
  Users,
} from "lucide-react"

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
  Dashboard: LayoutDashboard,
  Campaigns: Megaphone,
  Creators: Users,
  Content: Calendar,
  Settings: Settings2,
}

const navMain = navMainConfig.map((item) => ({
  ...item,
  icon: navMainIcons[item.title] ?? Settings2,
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
      logo: GalleryVerticalEnd,
      plan: "Agency",
    },
  ],
  navMain,
  projects: [
    { name: "Instagram", url: "#", icon: BarChart3 },
    { name: "TikTok", url: "#", icon: BarChart3 },
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
    <Sidebar collapsible="icon" {...props}>
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
