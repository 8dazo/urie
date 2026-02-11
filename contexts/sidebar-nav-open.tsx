"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

const STORAGE_KEY = "urie-sidebar-open"

export type NavItem = {
  title: string
  url: string
  items?: { title: string; url: string }[]
}

function readStoredOpenKeys(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : []
  } catch {
    return []
  }
}

function writeStoredOpenKeys(keys: string[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
  } catch {
    // ignore
  }
}

function findSectionForPathname(
  pathname: string,
  items: NavItem[]
): NavItem | undefined {
  return items.find(
    (item) =>
      pathname === item.url ||
      (item.items?.some((sub) => sub.url === pathname) ?? false)
  )
}

function getInitialOpenKeys(pathname: string, items: NavItem[]): Set<string> {
  const section = findSectionForPathname(pathname, items)
  return section ? new Set([section.title]) : new Set()
}

export function sectionContainsPathname(
  pathname: string,
  sectionUrl: string,
  itemUrls: { url: string }[]
): boolean {
  if (pathname === sectionUrl) return true
  return itemUrls.some((sub) => sub.url === pathname)
}

interface SidebarNavOpenContextValue {
  openKeys: Set<string>
  setOpenKey: (title: string, open: boolean) => void
}

const SidebarNavOpenContext =
  React.createContext<SidebarNavOpenContextValue | null>(null)

export function useSidebarNavOpen(): SidebarNavOpenContextValue {
  const ctx = React.useContext(SidebarNavOpenContext)
  if (!ctx) {
    throw new Error("useSidebarNavOpen must be used within SidebarNavOpenProvider")
  }
  return ctx
}

interface SidebarNavOpenProviderProps {
  children: React.ReactNode
  items: NavItem[]
}

export function SidebarNavOpenProvider({ children, items }: SidebarNavOpenProviderProps) {
  const pathname = usePathname()

  const [openKeys, setOpenKeysState] = React.useState<Set<string>>(() =>
    getInitialOpenKeys(pathname, items)
  )

  const hasRestoredFromStorage = React.useRef(false)

  React.useLayoutEffect(() => {
    if (hasRestoredFromStorage.current) return
    hasRestoredFromStorage.current = true

    const section = findSectionForPathname(pathname, items)
    // Only the section for the current page stays open (accordion); same when reopening sidebar.
    const open = section ? new Set([section.title]) : new Set<string>()
    setOpenKeysState(open)
    writeStoredOpenKeys(Array.from(open))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setOpenKey = React.useCallback((title: string, open: boolean) => {
    setOpenKeysState((prev) => {
      // Accordion: only one section open at a time; closing the dropdown keeps only current section.
      const next = open ? new Set([title]) : new Set(prev)
      if (!open) next.delete(title)
      writeStoredOpenKeys(Array.from(next))
      return next
    })
  }, [])

  // Keep only the section for the current pathname open when route changes (e.g. open Settings page → Settings stays open).
  React.useEffect(() => {
    const section = findSectionForPathname(pathname, items)
    if (section) {
      setOpenKeysState((prev) => {
        if (prev.has(section.title)) return prev
        const next = new Set([section.title])
        writeStoredOpenKeys(Array.from(next))
        return next
      })
    }
  }, [pathname, items])

  const value = React.useMemo<SidebarNavOpenContextValue>(
    () => ({ openKeys, setOpenKey }),
    [openKeys, setOpenKey]
  )

  return (
    <SidebarNavOpenContext.Provider value={value}>
      {children}
    </SidebarNavOpenContext.Provider>
  )
}
