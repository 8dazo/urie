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
  avatar_url?: string;
  avatar_url_100?: string;
  display_name?: string;
};

function parseMeta(meta: unknown): Meta {
  if (!meta || typeof meta !== "object") return {};
  const m = meta as Record<string, unknown>;
  return {
    avatar_url: typeof m.avatar_url === "string" ? m.avatar_url : undefined,
    avatar_url_100: typeof m.avatar_url_100 === "string" ? m.avatar_url_100 : undefined,
    display_name: typeof m.display_name === "string" ? m.display_name : undefined,
  };
}

export function TikTokAccountCard({ account }: { account: Account }) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);
  const meta = parseMeta(account.meta);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch(
        `/api/integrations/tiktok/accounts/${encodeURIComponent(account.id)}`,
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
        {(meta.avatar_url_100 || meta.avatar_url) && (
          <AvatarImage
            src={meta.avatar_url_100 || meta.avatar_url}
            alt={account.handle}
          />
        )}
        <AvatarFallback className="text-sm">
          {account.handle.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{account.handle}</p>
        {meta.display_name && (
          <p className="text-sm text-muted-foreground">{meta.display_name}</p>
        )}
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
