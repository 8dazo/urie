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
      new URL("/login?callbackUrl=/integrations/instagram", req.url)
    );
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });
  if (!creator) {
    return NextResponse.redirect(
      new URL(
        "/integrations/instagram?error=creator_required&error_description=You+must+be+set+up+as+a+creator+to+link+Instagram+accounts",
        req.url
      )
    );
  }

  const INSTAGRAM_APP_ID = process.env.AUTH_INSTAGRAM_ID;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/instagram/callback`;

  const SCOPES = [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
    "instagram_business_content_publish",
  ].join(",");

  if (!INSTAGRAM_APP_ID) {
    return NextResponse.json(
      { error: "Instagram App ID not configured" },
      { status: 500 }
    );
  }

  const state = Buffer.from(
    JSON.stringify({ creatorId: creator.id, agencyId: creator.agencyId })
  ).toString("base64url");

  const authUrl = addToUrl("https://www.instagram.com/oauth/authorize", {
    client_id: INSTAGRAM_APP_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    state,
  });

  return NextResponse.redirect(authUrl);
}
