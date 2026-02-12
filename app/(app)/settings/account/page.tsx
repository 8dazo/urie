import { PageBackHeader } from "@/components/page-back-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountProfileTab } from "@/components/settings/account/account-profile-tab"
import { AccountSecurityTab } from "@/components/settings/account/account-security-tab"
import { AccountSessionsTab } from "@/components/settings/account/account-sessions-tab"

export default function AccountSettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* <PageBackHeader href="/settings" title="Account Settings" /> */}
      <div className="w-full max-w-2xl">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto rounded-none">
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
          >
            Security
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
          >
            Sessions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <AccountProfileTab />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <AccountSecurityTab />
        </TabsContent>
        <TabsContent value="sessions" className="mt-6">
          <AccountSessionsTab />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
