import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessToken, fetchUserVideos } from "@/lib/tiktok/client";

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
  if (!accessToken) {
    return NextResponse.json({ error: "Account not connected" }, { status: 400 });
  }

  try {
    const { videos } = await fetchUserVideos(accessToken, 20);
    const now = new Date();

    for (const video of videos) {
      const existing = await prisma.socialVideo.findUnique({
        where: {
          socialAccountId_externalId: {
            socialAccountId: accountId,
            externalId: video.id,
          },
        },
      });

      if (existing) {
        await prisma.socialVideoMetrics.create({
          data: {
            socialVideoId: existing.id,
            snapshotTime: now,
            views: video.view_count,
            likes: video.like_count,
            comments: video.comment_count,
            shares: video.share_count,
            engagementRate:
              video.view_count > 0
                ? ((video.like_count + video.comment_count + video.share_count) /
                    video.view_count) *
                  100
                : 0,
          },
        });
      }
    }

    return NextResponse.json({ success: true, videosUpdated: videos.length });
  } catch (error) {
    console.error("Failed to refresh TikTok metrics:", error);
    return NextResponse.json(
      { error: "Failed to refresh metrics" },
      { status: 500 }
    );
  }
}