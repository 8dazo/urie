"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Unplug } from "lucide-react";

type Account = {
  id: string;
  handle: string;
  externalId: string | null;
  status: string;
  meta: unknown;
};

type Meta = {
  followers_count?: number;
  media_count?: number;
  profile_picture_url?: string;
  account_type?: string;
};

function parseMeta(meta: unknown): Meta {
  if (!meta || typeof meta !== "object") return {};
  const m = meta as Record<string, unknown>;
  return {
    followers_count: typeof m.followers_count === "number" ? m.followers_count : undefined,
    media_count: typeof m.media_count === "number" ? m.media_count : undefined,
    profile_picture_url: typeof m.profile_picture_url === "string" ? m.profile_picture_url : undefined,
    account_type: typeof m.account_type === "string" ? m.account_type : undefined,
  };
}

export function InstagramAccountCard({ account }: { account: Account }) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);
  const meta = parseMeta(account.meta);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch(
        `/api/integrations/instagram/accounts/${encodeURIComponent(account.id)}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.error(json.error ?? "Failed to disconnect");
        return;
      }
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <li className="flex items-center gap-4 rounded-lg border bg-card p-4 text-card-foreground">
      <Avatar className="h-12 w-12">
        {meta.profile_picture_url && (
          <AvatarImage src={meta.profile_picture_url} alt={account.handle} />
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
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleDisconnect}
        disabled={disconnecting}
        aria-label="Disconnect account"
      >
        <Unplug className="size-4" />
        Disconnect
      </Button>
    </li>
  );
}
