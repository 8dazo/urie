import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessToken, getInstagramAccountId, fetchUserMedia } from "@/lib/instagram/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await req.json();
  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const accessToken = await getAccessToken(accountId);
  const instagramAccountId = await getInstagramAccountId(accountId);
  
  if (!accessToken || !instagramAccountId) {
    return NextResponse.json({ error: "Account not connected" }, { status: 400 });
  }

  try {
    const media = await fetchUserMedia(accessToken, instagramAccountId, 20);
    const now = new Date();

    for (const m of media) {
      const existing = await prisma.socialVideo.findUnique({
        where: {
          socialAccountId_externalId: {
            socialAccountId: accountId,
            externalId: m.id,
          },
        },
      });

      if (existing) {
        await prisma.socialVideoMetrics.create({
          data: {
            socialVideoId: existing.id,
            snapshotTime: now,
            views: m.impression_count ?? 0,
            likes: m.like_count,
            comments: m.comments_count,
            shares: m.share_count,
            saves: m.save_count,
            engagementRate:
              (m.impression_count ?? 0) > 0
                ? ((m.like_count + m.comments_count + m.share_count + m.save_count) /
                    (m.impression_count ?? 1)) *
                  100
                : 0,
          },
        });
      }
    }

    return NextResponse.json({ success: true, videosUpdated: media.length });
  } catch (error) {
    console.error("Failed to refresh Instagram metrics:", error);
    return NextResponse.json(
      { error: "Failed to refresh metrics" },
      { status: 500 }
    );
  }
}