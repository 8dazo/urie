"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

type SessionItem = {
  id: string
  userAgent: string
  createdAt: string
  isCurrent: boolean
}

export function AccountSessionsTab() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  async function loadSessions() {
    setError(null)
    try {
      const res = await fetch("/api/account/sessions")
      if (!res.ok) {
        setError("Failed to load sessions")
        return
      }
      const json = await res.json()
      setSessions(json.sessions ?? [])
    } catch {
      setError("Failed to load sessions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId)
    try {
      const res = await fetch(`/api/account/sessions?id=${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? "Failed to end session")
        setRevokingId(null)
        return
      }
      if (json.revokedCurrentSession) {
        await signOut({ redirect: false })
        router.push("/login")
        return
      }
      await loadSessions()
    } finally {
      setRevokingId(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <p className="text-muted-foreground">Loading sessions…</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground">
      <h2 className="text-lg font-semibold">Active Sessions</h2>
      <p className="text-muted-foreground text-sm mt-1">
        These are all the active sessions of your account. Click the X to end a specific session.
      </p>
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
      <ul className="mt-6 flex flex-col gap-3">
        {sessions.length === 0 ? (
          <li className="text-muted-foreground text-sm">No active sessions.</li>
        ) : (
          sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-4 rounded-lg border bg-background p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {session.isCurrent ? "Current session" : "Other session"}
                </p>
                <p className="text-muted-foreground text-sm font-mono truncate mt-0.5" title={session.userAgent}>
                  {session.userAgent || "Unknown device"}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => handleRevoke(session.id)}
                disabled={revokingId === session.id}
                aria-label="End this session"
              >
                <X className="size-4" />
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
