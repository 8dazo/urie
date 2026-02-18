import { decryptToken } from "@/lib/token-encrypt";
import { prisma } from "@/lib/prisma";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

export interface TikTokVideo {
  id: string;
  title: string;
  cover_image_url: string;
  share_url: string;
  video_description: string;
  duration: number;
  create_time: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

export async function getAccessToken(accountId: string): Promise<string | null> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });
  if (!account?.accessToken) return null;
  return decryptToken(account.accessToken);
}

export async function fetchUserVideos(
  accessToken: string,
  maxCount = 20,
  cursor?: number
): Promise<{ videos: TikTokVideo[]; cursor?: number; has_more: boolean }> {
  const params = new URLSearchParams({ max_count: String(maxCount) });
  if (cursor) params.set("cursor", String(cursor));

  const res = await fetch(`${TIKTOK_API_BASE}/video/list/?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`TikTok API error: ${JSON.stringify(error)}`);
  }

  const data = await res.json();
  return {
    videos: data.data?.videos ?? [],
    cursor: data.data?.cursor,
    has_more: data.data?.has_more ?? false,
  };
}