import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { InstagramAccountCard } from "@/components/instagram/instagram-account-card";
import { InstagramAnalyticsDashboard } from "@/components/instagram/instagram-analytics-dashboard";
import { InstagramMediaGrid } from "@/components/instagram/instagram-media-grid";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function IntegrationsInstagramPage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;

  const error = typeof params.error === "string" ? params.error : undefined;
  const errorDescription =
    typeof params.error_description === "string"
      ? params.error_description
      : undefined;

  let accounts: Awaited<ReturnType<typeof loadAccounts>> = [];
  let creatorExists = false;

  if (session?.user?.id) {
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });
    creatorExists = !!creator;
    if (creator) {
      accounts = await loadAccounts(creator.id);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-2xl">
        <h1 className="text-lg font-semibold">Instagram</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Instagram Business or Creator account to schedule posts
          and view insights.
        </p>
      </div>

      {error && (
        <div className="max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">{error}</p>
          {errorDescription && (
            <p className="text-sm mt-1">{errorDescription}</p>
          )}
        </div>
      )}

      {!creatorExists ? (
        <div className="max-w-2xl rounded-lg border bg-card p-6 text-card-foreground">
          <p className="text-muted-foreground">
            You must be set up as a creator to link Instagram accounts. Contact
            your agency to get set up.
          </p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="max-w-2xl rounded-lg border bg-card p-6 text-card-foreground">
          <p className="text-muted-foreground mb-4">
            No Instagram accounts connected yet.
          </p>
          <Button asChild>
            <Link href="/api/auth/instagram/login">Connect Instagram</Link>
          </Button>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {accounts.length} account{accounts.length !== 1 ? "s" : ""}{" "}
              connected
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/auth/instagram/login">
                Add another account
              </Link>
            </Button>
          </div>

          <ul className="space-y-3">
            {accounts.map((account) => (
              <InstagramAccountCard key={account.id} account={account} />
            ))}
          </ul>

          <div className="space-y-6 mt-8">
            <InstagramAnalyticsDashboard accountId={accounts[0].id} />
            <InstagramMediaGrid accountId={accounts[0].id} />
          </div>
        </div>
      )}
    </div>
  );
}

async function loadAccounts(creatorId: string) {
  return prisma.socialAccount.findMany({
    where: {
      creatorId,
      platform: "instagram",
      status: "active",
    },
    select: {
      id: true,
      handle: true,
      externalId: true,
      status: true,
      meta: true,
    },
  });
}
