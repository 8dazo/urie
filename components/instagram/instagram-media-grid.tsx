"use client";

import { useEffect, useState } from "react";

type VideoMetrics = {
  snapshotTime: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
};

type Video = {
  id: string;
  externalId: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  shareUrl: string | null;
  publishedAt: string | null;
  metrics: VideoMetrics | null;
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function InstagramMediaGrid({ accountId }: { accountId: string }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      const res = await fetch(
        `/api/integrations/instagram/analytics/videos?accountId=${encodeURIComponent(accountId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
      setLoading(false);
    }
    fetchVideos();
  }, [accountId]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetch(
      `/api/integrations/instagram/analytics/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      }
    );
    const res = await fetch(
      `/api/integrations/instagram/analytics/videos?accountId=${encodeURIComponent(accountId)}`
    );
    if (res.ok) {
      const data = await res.json();
      setVideos(data.videos || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No posts found. Click refresh to fetch from Instagram.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleRefresh}
          className="px-3 py-1 text-sm border rounded hover:bg-muted"
        >
          Refresh Metrics
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.shareUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border bg-card overflow-hidden hover:border-primary transition-colors"
          >
            <div className="relative aspect-square bg-muted">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title || "Post"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  No thumbnail
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="truncate font-medium text-sm">
                {video.title || "Untitled"}
              </p>
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                <span>{formatNumber(video.metrics?.views ?? 0)} impressions</span>
                <span>{formatNumber(video.metrics?.likes ?? 0)} likes</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}