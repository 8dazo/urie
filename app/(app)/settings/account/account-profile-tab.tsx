"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const AVATAR_MAX_SIZE_PX = 384
const AVATAR_JPEG_QUALITY = 0.85

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

function resizeImageToDataUrl(
  dataUrl: string,
  maxSize: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      let { width, height } = img
      if (width <= maxSize && height <= maxSize) {
        resolve(dataUrl)
        return
      }
      if (width > height) {
        height = Math.round((height * maxSize) / width)
        width = maxSize
      } else {
        width = Math.round((width * maxSize) / height)
        height = maxSize
      }
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      try {
        const resized = canvas.toDataURL("image/jpeg", quality)
        resolve(resized)
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = dataUrl
  })
}

type Profile = {
  name: string | null
  avatar: string | null
  bio: string | null
}

type ProfileData = {
  id: string
  email: string
  profile: Profile
}

export function AccountProfileTab() {
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatar, setAvatar] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !file.type.startsWith("image/")) return
      setUploading(true)
      setUploadPreview(null)
      try {
        let dataUrl = await fileToBase64(file)
        dataUrl = await resizeImageToDataUrl(
          dataUrl,
          AVATAR_MAX_SIZE_PX,
          AVATAR_JPEG_QUALITY
        )
        setUploadPreview(dataUrl)
        setUploadOpen(true)
      } catch {
        setUploadPreview(null)
      } finally {
        setUploading(false)
        e.target.value = ""
      }
    },
    []
  )

  const applyUpload = useCallback(() => {
    if (uploadPreview) {
      setAvatar(uploadPreview)
      setUploadPreview(null)
      setUploadOpen(false)
    }
  }, [uploadPreview])

  const closeUpload = useCallback(() => {
    setUploadOpen(false)
    setUploadPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/account/profile")
        if (!res.ok) {
          if (!cancelled) setError("Failed to load profile")
          return
        }
        const json = await res.json()
        if (!cancelled) {
          setData(json)
          setName(json.profile?.name ?? "")
          setEmail(json.email ?? "")
          setAvatar(json.profile?.avatar ?? "")
        }
      } catch {
        if (!cancelled) setError("Failed to load profile")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaving(true)
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email: email.trim() || undefined, avatar: avatar.trim() || undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSaveError(json.error ?? "Failed to update profile")
        return
      }
      const profile = json.profile ?? {}
      setData((prev) => (prev ? { ...prev, ...json } : null))
      setName(profile.name ?? "")
      setEmail(json.email ?? "")
      setAvatar(profile.avatar ?? "")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return
    setDeleteError(null)
    setDeleting(true)
    try {
      const res = await fetch("/api/account", { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setDeleteError(json.error ?? "Failed to delete account")
        return
      }
      await signOut({ redirect: false })
      router.push("/login")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <p className="text-muted-foreground">Loading profile…</p>
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <p className="text-destructive">{error ?? "Profile not found"}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="text-lg font-semibold">Your profile</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Update your profile picture and display name.
        </p>
        <form onSubmit={handleSaveProfile} className="mt-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Profile picture</FieldLabel>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-hidden
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative rounded-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Upload profile picture"
                >
                  <Avatar className="h-16 w-16 rounded-lg" key={avatar || "fallback"}>
                    <AvatarImage src={avatar || undefined} alt={name || "Avatar"} />
                    <AvatarFallback className="rounded-lg text-lg">
                      {(name || email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                    <Upload className="size-6 text-white" />
                  </span>
                </button>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadOpen(true)}
                  >
                    <Upload className="mr-2 size-4" />
                    Upload photo
                  </Button>
                  <FieldDescription className="mt-1">
                    Click the avatar or button to upload an image. It will be saved and shown in your profile and sidebar.
                  </FieldDescription>
                </div>
              </div>
            </Field>
            <Sheet open={uploadOpen} onOpenChange={(open) => !open && closeUpload()}>
              <SheetContent side="right" className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>Upload profile picture</SheetTitle>
                  <SheetDescription>
                    Choose an image. It will be resized and saved as your avatar.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Processing…" : "Choose image"}
                  </Button>
                  {uploadPreview && (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">Preview</p>
                      <div className="flex justify-center rounded-lg border bg-muted/30 p-4">
                        <img
                          src={uploadPreview}
                          alt="Preview"
                          className="max-h-48 max-w-full rounded-lg object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <SheetFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeUpload}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={applyUpload}
                    disabled={!uploadPreview}
                  >
                    Use this photo
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Field>
              <FieldLabel htmlFor="profile-name">Name</FieldLabel>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <FieldDescription>Your email address for sign-in and notifications.</FieldDescription>
            </Field>
            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </section>

      <section className="rounded-lg border border-destructive/50 bg-card p-6 text-card-foreground">
        <h2 className="text-lg font-semibold text-destructive">Delete account</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Permanently delete your account and all associated data.
        </p>
        {deleteError && (
          <p className="text-sm text-destructive mt-2">{deleteError}</p>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete account"}
          </Button>
        </div>
      </section>
    </div>
  )
}
