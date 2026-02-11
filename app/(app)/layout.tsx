import { LogOut } from "lucide-react"
import { auth, signOut } from "@/lib/auth"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  const signOutAction = async () => {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={
          session?.user
            ? {
                name: session.user.name ?? session.user.email ?? "User",
                email: session.user.email ?? "",
                avatar: session.user.image ?? undefined,
              }
            : undefined
        }
        signOutForm={
          session ? (
            <form action={signOutAction}>
              <button type="submit" className="flex w-full items-center gap-2">
                <LogOut className="size-4" />
                Log out
              </button>
            </form>
          ) : undefined
        }
      />
      <SidebarInset>
        <div className="flex flex-col gap-4 p-4 pt-0"/>
        <AppHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
