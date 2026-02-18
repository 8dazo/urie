import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessToken, fetchUserVideos } from "@/lib/tiktok/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const accountId = searchParams.get("accountId");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const accessToken = await getAccessToken(accountId);
  if (!accessToken) {
    return NextResponse.json({ error: "Account not connected" }, { status: 400 });
  }

  try {
    const { videos } = await fetchUserVideos(accessToken, limit);

    const existingVideos = await prisma.socialVideo.findMany({
      where: { socialAccountId: accountId },
      select: { externalId: true },
    });
    const existingIds = new Set(existingVideos.map((v) => v.externalId));

    const videosToStore = videos.map((v) => ({
      socialAccountId: accountId,
      platform: "tiktok" as const,
      externalId: v.id,
      title: v.title,
      description: v.video_description,
      thumbnailUrl: v.cover_image_url,
      shareUrl: v.share_url,
      duration: v.duration,
      publishedAt: new Date(v.create_time * 1000),
    }));

    for (const video of videosToStore) {
      if (!existingIds.has(video.externalId)) {
        await prisma.socialVideo.create({ data: video });
        existingIds.add(video.externalId);
      }
    }

    const storedVideos = await prisma.socialVideo.findMany({
      where: { socialAccountId: accountId },
      orderBy: { publishedAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        metrics: {
          orderBy: { snapshotTime: "desc" },
          take: 1,
        },
      },
    });

    const videosWithMetrics = storedVideos.map((v) => ({
      id: v.id,
      externalId: v.externalId,
      title: v.title,
      description: v.description,
      thumbnailUrl: v.thumbnailUrl,
      shareUrl: v.shareUrl,
      duration: v.duration,
      publishedAt: v.publishedAt,
      metrics: v.metrics[0] || null,
    }));

    return NextResponse.json({ videos: videosWithMetrics });
  } catch (error) {
    console.error("Failed to fetch TikTok videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}