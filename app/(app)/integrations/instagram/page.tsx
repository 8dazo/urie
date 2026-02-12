import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function parseMeta(meta: unknown): {
  followers_count?: number;
  media_count?: number;
  profile_picture_url?: string;
  account_type?: string;
} {
  if (!meta || typeof meta !== "object") return {};
  const m = meta as Record<string, unknown>;
  return {
    followers_count: typeof m.followers_count === "number" ? m.followers_count : undefined,
    media_count: typeof m.media_count === "number" ? m.media_count : undefined,
    profile_picture_url: typeof m.profile_picture_url === "string" ? m.profile_picture_url : undefined,
    account_type: typeof m.account_type === "string" ? m.account_type : undefined,
  };
}

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
            {accounts.map((account) => {
              const meta = parseMeta(account.meta);
              return (
                <li
                  key={account.id}
                  className="flex items-center gap-4 rounded-lg border bg-card p-4 text-card-foreground"
                >
                  <Avatar className="h-12 w-12">
                    {meta.profile_picture_url && (
                      <AvatarImage
                        src={meta.profile_picture_url}
                        alt={account.handle}
                      />
                    )}
                    <AvatarFallback className="text-sm">
                      {account.handle.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{account.handle}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {meta.followers_count != null && (
                        <span>{meta.followers_count} followers</span>
                      )}
                      {meta.media_count != null && (
                        <span>{meta.media_count} media</span>
                      )}
                      {meta.account_type && (
                        <span className="capitalize">
                          {meta.account_type.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      account.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {account.status}
                  </span>
                </li>
              );
            })}
          </ul>
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
