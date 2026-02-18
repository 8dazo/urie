import { decryptToken } from "@/lib/token-encrypt";
import { prisma } from "@/lib/prisma";

const INSTAGRAM_API_BASE = "https://graph.instagram.com";

export interface InstagramMedia {
  id: string;
  caption: string | null;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  save_count: number;
  share_count: number;
  reach_count: number | null;
  impression_count: number | null;
}

export async function getAccessToken(accountId: string): Promise<string | null> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });
  if (!account?.accessToken) return null;
  return decryptToken(account.accessToken);
}

export async function getInstagramAccountId(accountId: string): Promise<string | null> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });
  return account?.externalId || null;
}

export async function fetchUserMedia(
  accessToken: string,
  accountId: string,
  limit = 20
): Promise<InstagramMedia[]> {
  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp",
    "like_count",
    "comments_count",
    "save_count",
    "share_count",
  ].join(",");

  const url = new URL(`/${accountId}/media`, INSTAGRAM_API_BASE);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString());

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
  }

  const data = await res.json();
  return data.data || [];
}

export async function fetchMediaInsights(
  accessToken: string,
  mediaId: string
): Promise<{
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reach: number;
  impressions: number;
}> {
  const fields = ["like_count", "comments_count", "saved", "share_count", "reach", "impressions"];
  
  const url = new URL(`/${mediaId}/insights`, INSTAGRAM_API_BASE);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("metric", fields.join(","));

  const res = await fetch(url.toString());

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Instagram Insights error: ${JSON.stringify(error)}`);
  }

  const data = await res.json();
  
  const metrics: Record<string, number> = {};
  if (data.data) {
    for (const metric of data.data) {
      metrics[metric.name] = metric.values?.[0]?.value ?? 0;
    }
  }

  return {
    likes: metrics.like_count ?? 0,
    comments: metrics.comments_count ?? 0,
    saves: metrics.saved ?? 0,
    shares: metrics.share_count ?? 0,
    reach: metrics.reach ?? 0,
    impressions: metrics.impressions ?? 0,
  };
}