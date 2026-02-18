import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessToken, getInstagramAccountId, fetchUserMedia, type InstagramMedia } from "@/lib/instagram/client";

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
  const instagramAccountId = await getInstagramAccountId(accountId);
  
  if (!accessToken || !instagramAccountId) {
    return NextResponse.json({ error: "Account not connected" }, { status: 400 });
  }

  try {
    const media = await fetchUserMedia(accessToken, instagramAccountId, limit);

    const existingVideos = await prisma.socialVideo.findMany({
      where: { socialAccountId: accountId },
      select: { externalId: true },
    });
    const existingIds = new Set(existingVideos.map((v) => v.externalId));

    const videosToStore = media.map((m: InstagramMedia) => ({
      socialAccountId: accountId,
      platform: "instagram" as const,
      externalId: m.id,
      title: m.caption?.slice(0, 150) || null,
      description: m.caption,
      thumbnailUrl: m.thumbnail_url || m.media_url,
      videoUrl: m.media_type === "VIDEO" ? m.media_url : null,
      shareUrl: m.permalink,
      publishedAt: new Date(m.timestamp),
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
      publishedAt: v.publishedAt,
      metrics: v.metrics[0] || null,
    }));

    return NextResponse.json({ videos: videosWithMetrics });
  } catch (error) {
    console.error("Failed to fetch Instagram media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}