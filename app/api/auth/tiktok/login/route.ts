import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const addToUrl = (url: string, params: Record<string, string>) => {
    const urlObj = new URL(url);
    Object.keys(params).forEach((key) =>
      urlObj.searchParams.append(key, params[key])
    );
    return urlObj.toString();
  };

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/login?callbackUrl=/integrations/tiktok", req.url)
    );
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });
  if (!creator) {
    return NextResponse.redirect(
      new URL(
        "/integrations/tiktok?error=creator_required&error_description=You+must+be+set+up+as+a+creator+to+link+TikTok+accounts",
        req.url
      )
    );
  }

  const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/tiktok/callback`;

  // user.info.basic: avatar, display name. video.list: public videos (for content scheduling)
  const SCOPES = ["user.info.basic", "video.list"].join(",");

  if (!TIKTOK_CLIENT_KEY) {
    return NextResponse.json(
      { error: "TikTok Client Key not configured" },
      { status: 500 }
    );
  }

  const state = Buffer.from(
    JSON.stringify({ creatorId: creator.id, agencyId: creator.agencyId })
  ).toString("base64url");

  const authUrl = addToUrl("https://www.tiktok.com/v2/auth/authorize/", {
    client_key: TIKTOK_CLIENT_KEY,
    scope: SCOPES,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    state,
  });

  return NextResponse.redirect(authUrl);
}
