import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/token-encrypt";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const redirectUrl = new URL("/integrations/tiktok", baseUrl);

  if (error) {
    redirectUrl.searchParams.set("error", error);
    if (errorDescription)
      redirectUrl.searchParams.set("error_description", errorDescription);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set("error", "no_code");
    redirectUrl.searchParams.set(
      "error_description",
      "No authorization code provided"
    );
    return NextResponse.redirect(redirectUrl);
  }

  let creatorId: string;
  let agencyId: string;
  try {
    const decoded = JSON.parse(
      Buffer.from(state || "", "base64url").toString()
    ) as { creatorId?: string; agencyId?: string };
    if (!decoded?.creatorId || !decoded?.agencyId) {
      throw new Error("Invalid state");
    }
    creatorId = decoded.creatorId;
    agencyId = decoded.agencyId;
  } catch {
    redirectUrl.searchParams.set("error", "invalid_state");
    redirectUrl.searchParams.set(
      "error_description",
      "Invalid or missing state. Please try connecting again."
    );
    return NextResponse.redirect(redirectUrl);
  }

  const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
  const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
  const REDIRECT_URI = `${baseUrl}/api/auth/tiktok/callback`;

  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
    redirectUrl.searchParams.set("error", "config");
    redirectUrl.searchParams.set(
      "error_description",
      "TikTok credentials not configured"
    );
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const formData = new URLSearchParams();
    formData.append("client_key", TIKTOK_CLIENT_KEY);
    formData.append("client_secret", TIKTOK_CLIENT_SECRET);
    formData.append("code", code);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", REDIRECT_URI);

    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      redirectUrl.searchParams.set("error", "token_exchange");
      redirectUrl.searchParams.set(
        "error_description",
        tokenData.error_description || "Failed to exchange code for token"
      );
      return NextResponse.redirect(redirectUrl);
    }

    const accessToken = tokenData.access_token as string;
    const refreshToken = tokenData.refresh_token as string | undefined;
    const openId = tokenData.open_id as string;

    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,avatar_url_100",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const userData = await userRes.json();

    const user = userData.data?.user;
    const displayName = user?.display_name || `TikTok ${openId}`;
    const handle = displayName.startsWith("@")
      ? displayName
      : `@${displayName.replace(/\s+/g, "_")}`;

    if (!openId) {
      redirectUrl.searchParams.set("error", "no_user_id");
      redirectUrl.searchParams.set(
        "error_description",
        "TikTok did not return a user ID"
      );
      return NextResponse.redirect(redirectUrl);
    }

    const meta: Record<string, unknown> = {
      avatar_url: user?.avatar_url ?? null,
      avatar_url_100: user?.avatar_url_100 ?? null,
      display_name: user?.display_name ?? null,
    };
    if (refreshToken) {
      meta.refresh_token = encryptToken(refreshToken);
    }

    const encryptedToken = encryptToken(accessToken);

    const existing = await prisma.socialAccount.findFirst({
      where: {
        creatorId,
        agencyId,
        platform: "tiktok",
        externalId: openId,
      },
    });

    if (existing) {
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          handle,
          accessToken: encryptedToken,
          status: "active",
          meta,
        },
      });
    } else {
      await prisma.socialAccount.create({
        data: {
          creatorId,
          agencyId,
          platform: "tiktok",
          handle,
          externalId: openId,
          accessToken: encryptedToken,
          status: "active",
          meta,
        },
      });
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("TikTok callback error:", err);
    redirectUrl.searchParams.set("error", "failed");
    redirectUrl.searchParams.set(
      "error_description",
      "An error occurred while connecting your account"
    );
    return NextResponse.redirect(redirectUrl);
  }
}
