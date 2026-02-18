"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  topVideos: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    views: number;
    likes: number;
  }[];
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function TikTokAnalyticsDashboard({ accountId }: { accountId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch(
        `/api/integrations/tiktok/analytics/stats?accountId=${encodeURIComponent(accountId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
      setLoading(false);
    }
    fetchStats();
  }, [accountId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg border bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: "Total Videos", value: stats.totalVideos },
    { label: "Total Views", value: formatNumber(stats.totalViews) },
    { label: "Total Likes", value: formatNumber(stats.totalLikes) },
    { label: "Engagement Rate", value: `${stats.avgEngagementRate}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border bg-card p-4 text-card-foreground"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      {stats.topVideos.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Top Videos</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stats.topVideos.map((video) => (
              <div
                key={video.id}
                className="rounded-lg border bg-card overflow-hidden"
              >
                {video.thumbnailUrl && (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title || "Video"}
                    className="w-full aspect-[9/16] object-cover"
                  />
                )}
                <div className="p-2">
                  <p className="truncate text-sm font-medium">
                    {video.title || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(video.views)} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}