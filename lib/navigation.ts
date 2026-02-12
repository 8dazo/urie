/**
 * Central route and breadcrumb config. Drives breadcrumbs and sidebar nav.
 */

export type BreadcrumbSegment = {
  label: string
  href?: string
}

export type RouteBreadcrumbConfig = {
  label: string
  parent?: { label: string; href: string }
}

export type NavMainItemConfig = {
  title: string
  url: string
  items: { title: string; url: string }[]
}

/** Sidebar nav structure (icons are applied in AppSidebar). */
export const navMainConfig: NavMainItemConfig[] = [
  {
    title: "Dashboard",
    url: "/",
    items: [
      { title: "Overview", url: "/" },
      { title: "Analytics", url: "/dashboard" },
    ],
  },
  {
    title: "Campaigns",
    url: "#",
    items: [
      { title: "All campaigns", url: "#" },
      { title: "Active", url: "#" },
      { title: "Scheduled", url: "#" },
    ],
  },
  {
    title: "Creators",
    url: "#",
    items: [
      { title: "All creators", url: "#" },
      { title: "Social accounts", url: "#" },
    ],
  },
  {
    title: "Content",
    url: "#",
    items: [
      { title: "Kanban", url: "#" },
      { title: "Calendar", url: "#" },
    ],
  },
  {
    title: "Integrations",
    url: "/integrations",
    items: [
      { title: "Instagram", url: "/integrations/instagram" },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    items: [
      { title: "General", url: "/settings" },
      { title: "Account", url: "/settings/account" },
      { title: "Team", url: "#" },
      { title: "Billing", url: "#" },
    ],
  },
]

const routeBreadcrumbs: Record<string, RouteBreadcrumbConfig> = {
  "/": { label: "Home" },
  "/dashboard": {
    label: "Analytics",
    parent: { label: "Dashboard", href: "/" },
  },
  "/settings": {
    label: "Settings",
    parent: { label: "Dashboard", href: "/" },
  },
  "/settings/account": {
    label: "Account Settings",
    parent: { label: "Settings", href: "/settings" },
  },
  "/integrations": {
    label: "Integrations",
    parent: { label: "Dashboard", href: "/" },
  },
  "/integrations/instagram": {
    label: "Instagram",
    parent: { label: "Integrations", href: "/integrations" },
  },
}

/**
 * Get breadcrumb segments for a pathname (for header breadcrumb UI).
 */
export function getBreadcrumbSegments(pathname: string): BreadcrumbSegment[] {
  const config = routeBreadcrumbs[pathname]
  if (!config) {
    // Fallback: use pathname segments
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return [{ label: "Home" }]
    return [
      { label: "Home", href: "/" },
      ...segments.map((s, i) => {
        const path = "/" + segments.slice(0, i + 1).join("/")
        return { label: s.charAt(0).toUpperCase() + s.slice(1), href: path }
      }),
    ]
  }
  const segments: BreadcrumbSegment[] = []
  if (config.parent) {
    segments.push({ label: config.parent.label, href: config.parent.href })
  }
  segments.push({ label: config.label })
  return segments
}
