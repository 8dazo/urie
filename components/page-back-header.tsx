import Link from "next/link"
import { ChevronLeft } from "lucide-react"

type PageBackHeaderProps = {
  href: string
  title: string
  children?: React.ReactNode
}

export function PageBackHeader({ href, title, children }: PageBackHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href={href}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  )
}
