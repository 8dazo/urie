import Link from "next/link";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getData(accessToken: string, userId: string) {
  try {
    // 1. Fetch User Info
    const userRes = await fetch(
      `https://graph.instagram.com/v24.0/me?fields=id,username,account_type,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
    );
    const userData = await userRes.json();

    // 2. Fetch Insights (Impressions, Reach, Profile Views) for the last day
    const insightsRes = await fetch(
      `https://graph.instagram.com/v24.0/${userId}/insights?metric=impressions,reach,profile_views&period=day&access_token=${accessToken}`
    );
    const insightsData = await insightsRes.json();

    return { userData, insightsData };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { error };
  }
}

export default async function IntegrationsInstagramPage({
  searchParams,
}: Props) {
  const { access_token, user_id, error, error_description } =
    await searchParams;

  let data = null;
  if (
    access_token &&
    typeof access_token === "string" &&
    typeof user_id === "string"
  ) {
    data = await getData(access_token, user_id);
  }

  const { userData, insightsData } = data || {};

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-start gap-12 py-32 px-16 bg-white dark:bg-zinc-900 sm:items-start text-black dark:text-white">
        <div className="w-full flex flex-col items-center sm:items-start gap-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Instagram Business Login POC
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            A proof of concept for Instagram Business Login without using
            NextAuth.js.
          </p>
        </div>

        <div className="w-full border-t border-zinc-200 dark:border-zinc-800 pt-12">
          {access_token ? (
            <div className="flex flex-col gap-8">
              {/* Success Message & Tokens */}
              <div className="flex flex-col gap-6 p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900">
                <h2 className="text-2xl font-semibold text-green-700 dark:text-green-400">
                  Login Successful!
                </h2>
                <div className="space-y-2">
                  <p className="text-sm font-mono break-all">
                    <span className="font-bold">User ID:</span> {user_id}
                  </p>
                </div>
              </div>

              {/* User Profile */}
              {userData && !userData.error && (
                <div className="flex items-center gap-6 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50">
                  {userData.profile_picture_url && (
                    <img
                      src={userData.profile_picture_url}
                      alt="Profile"
                      className="w-20 h-20 rounded-full border-2 border-zinc-100 dark:border-zinc-700"
                    />
                  )}
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold">@{userData.username}</h3>
                    <div className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                      <span>{userData.followers_count} Followers</span>
                      <span>•</span>
                      <span>{userData.media_count} Media</span>
                      <span>•</span>
                      <span className="capitalize">
                        {userData.account_type?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Insights */}
              {insightsData && !insightsData.error && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Daily Insights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {insightsData.data?.map((metric: { name: string; title: string; values: { value: string; end_time: string }[] }) => (
                      <div
                        key={metric.name}
                        className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                      >
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 capitalize">
                          {metric.title}
                        </p>
                        <p className="text-2xl font-bold mt-2">
                          {metric.values[metric.values.length - 1]?.value || 0}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {new Date(
                            metric.values[metric.values.length - 1]?.end_time
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {insightsData.error && (
                    <div className="p-4 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      <p>
                        Error fetching insights:{" "}
                        {JSON.stringify(insightsData.error)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Raw Data Dump (for debugging) */}
              <details className="cursor-pointer group">
                <summary className="font-medium text-sm text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
                  Show Raw Data
                </summary>
                <pre className="mt-4 p-4 rounded bg-zinc-100 dark:bg-zinc-950 overflow-x-auto text-xs font-mono">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>

              <Link
                href="/integrations/instagram"
                className="self-start px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Clear / Logout
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center sm:items-start gap-6">
              {error && (
                <div className="w-full p-4 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400">
                  <p className="font-semibold">Error: {error}</p>
                  <p>{error_description}</p>
                </div>
              )}

              <Link
                href="/api/auth/instagram/login"
                className="flex items-center gap-3 px-6 py-3 text-white bg-[#0095f6] hover:bg-[#00376b] rounded-lg font-semibold transition-colors shadow-lg shadow-blue-500/30"
              >
                Login with Instagram
              </Link>
              <p className="text-sm text-zinc-500">
                Redirects to{" "}
                <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                  /api/auth/instagram/login
                </code>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
