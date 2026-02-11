"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getBreadcrumbSegments } from "@/lib/navigation"

export function AppBreadcrumb() {
  const pathname = usePathname()
  const segments = getBreadcrumbSegments(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.flatMap((segment, i) => {
          const isLast = i === segments.length - 1
          const nodes: React.ReactNode[] = []
          if (i > 0) {
            nodes.push(
              <BreadcrumbSeparator
                key={`sep-${i}`}
                className="hidden md:inline-flex"
              />
            )
          }
          nodes.push(
            <BreadcrumbItem
              key={i}
              className={i > 0 ? "hidden md:inline-flex" : ""}
            >
              {isLast ? (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              ) : segment.href ? (
                <BreadcrumbLink asChild>
                  <Link href={segment.href}>{segment.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          )
          return nodes
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
