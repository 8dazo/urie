import { PageBackHeader } from "@/components/page-back-header"

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageBackHeader href="/" title="Settings" />
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <p className="text-muted-foreground">Settings content coming soon.</p>
      </div>
    </div>
  )
}
