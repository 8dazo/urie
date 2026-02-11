import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function Home() {
  let agencies: Awaited<ReturnType<typeof loadAgencies>> = []
  let users: Awaited<ReturnType<typeof loadUsers>> = []
  let error: string | null = null

  try {
    const [a, u] = await Promise.all([loadAgencies(), loadUsers()])
    agencies = a
    users = u
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load data"
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium">Setup required</p>
          <p className="mt-1 text-sm">{error}</p>
          <p className="mt-2 text-sm">
            Add a database name to <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">MONGODB_URI</code> (e.g. <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">...mongodb.net/urie?...</code>), then run <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">npx prisma db push</code> and <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">npx prisma db seed</code>.
          </p>
        </div>
      )}

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Agencies</h2>
        {agencies.length === 0 && !error && (
          <p className="text-muted-foreground">No agencies yet. Run <code className="rounded bg-muted px-1 py-0.5">npx prisma db seed</code>.</p>
        )}
        <ul className="space-y-3">
          {agencies.map((agency) => (
            <li
              key={agency.id}
              className="rounded-lg border bg-card p-4 text-card-foreground"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{agency.name}</p>
                  <p className="text-sm text-muted-foreground">/{agency.slug}</p>
                </div>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {agency._count.contentTasks} tasks
                </span>
              </div>
              {agency.creators.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {agency.creators.length} creator(s), {agency.campaigns.length} campaign(s)
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Users</h2>
        {users.length === 0 && !error && (
          <p className="text-muted-foreground">No users yet. Run <code className="rounded bg-muted px-1 py-0.5">npx prisma db seed</code>.</p>
        )}
        <ul className="space-y-2">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 text-card-foreground"
            >
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {user.role}
              </span>
              <span>{user.email}</span>
              {user.profile && typeof user.profile === "object" && "name" in user.profile && (
                <span className="text-sm text-muted-foreground">
                  {(user.profile as Record<string, string>).name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Plan: <Link href="/plan" className="underline hover:no-underline">product & tech plan</Link> · Guidelines in <code className="rounded bg-muted px-1 py-0.5">docs/GUIDELINES.md</code>
      </p>
    </div>
  )
}

async function loadAgencies() {
  return prisma.agency.findMany({
    include: {
      owner: { select: { id: true, email: true, profile: true, role: true } },
      creators: {
        include: {
          user: { select: { id: true, email: true, profile: true } },
          socialAccounts: { select: { id: true, platform: true, handle: true, status: true } },
        },
      },
      campaigns: { select: { id: true, name: true, status: true, platforms: true } },
      _count: { select: { contentTasks: true } },
    },
  })
}

async function loadUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, role: true, profile: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
}
