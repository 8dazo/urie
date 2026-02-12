"use client"

import { useState } from "react"
import { Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const MIN_PASSWORD_LENGTH = 8

export function AccountSecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const valid = newPassword.length >= MIN_PASSWORD_LENGTH && currentPassword.length > 0

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? "Failed to update password")
        return
      }
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="text-lg font-semibold">Update your Password</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Update your password to keep your account secure.
        </p>
        <form onSubmit={handleUpdatePassword} className="mt-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  required
                  className="pr-9"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrent((s) => !s)}
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  required
                  className="pr-9"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew((s) => !s)}
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FieldDescription className="flex items-center gap-1.5 mt-1">
                <span>{MIN_PASSWORD_LENGTH} or more characters</span>
                {newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH && (
                  <span className="text-destructive" aria-hidden>✕</span>
                )}
                {newPassword.length >= MIN_PASSWORD_LENGTH && (
                  <span className="text-green-600 dark:text-green-400" aria-hidden>✓</span>
                )}
              </FieldDescription>
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">Password updated successfully.</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={!valid || loading}>
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </section>

      <section className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="text-lg font-semibold">Two-factor Authentication</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Set up Two-factor Authentication method to further secure your account.
        </p>
        <p className="flex items-center gap-2 text-sm mt-3 text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" />
          Secure your account with an extra layer of security.
        </p>
        <div className="mt-4 flex justify-end">
          <Button disabled>
            Set up a new Factor
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="text-lg font-semibold">Connect account</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Link external accounts (e.g. Google, GitHub) for sign-in.
        </p>
        <p className="text-muted-foreground text-sm mt-2">Coming soon.</p>
      </section>
    </div>
  )
}
