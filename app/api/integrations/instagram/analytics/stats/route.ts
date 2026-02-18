import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const videos = await prisma.socialVideo.findMany({
    where: { socialAccountId: accountId, platform: "instagram" },
    include: {
      metrics: {
        orderBy: { snapshotTime: "desc" },
        take: 1,
      },
    },
  });

  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum, v) => sum + (v.metrics[0]?.views ?? 0), 0);
  const totalLikes = videos.reduce((sum, v) => sum + (v.metrics[0]?.likes ?? 0), 0);
  const totalComments = videos.reduce((sum, v) => sum + (v.metrics[0]?.comments ?? 0), 0);
  const totalShares = videos.reduce((sum, v) => sum + (v.metrics[0]?.shares ?? 0), 0);
  const totalSaves = videos.reduce((sum, v) => sum + (v.metrics[0]?.saves ?? 0), 0);

  const avgEngagementRate =
    totalViews > 0
      ? ((totalLikes + totalComments + totalShares + totalSaves) / totalViews) * 100
      : 0;

  const topVideos = [...videos]
    .sort((a, b) => (b.metrics[0]?.views ?? 0) - (a.metrics[0]?.views ?? 0))
    .slice(0, 5)
    .map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      views: v.metrics[0]?.views ?? 0,
      likes: v.metrics[0]?.likes ?? 0,
      comments: v.metrics[0]?.comments ?? 0,
    }));

  return NextResponse.json({
    totalVideos,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalSaves,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    topVideos,
  });
}