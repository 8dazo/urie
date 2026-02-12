import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/token-encrypt";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");
  const errorDescription = searchParams.get("error_description");

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const redirectUrl = new URL("/integrations/instagram", baseUrl);

  if (error) {
    redirectUrl.searchParams.set("error", error);
    if (errorReason) redirectUrl.searchParams.set("error_reason", errorReason);
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

  const INSTAGRAM_APP_ID = process.env.AUTH_INSTAGRAM_ID;
  const INSTAGRAM_APP_SECRET = process.env.AUTH_INSTAGRAM_SECRET;
  const REDIRECT_URI = `${baseUrl}/api/auth/instagram/callback`;

  if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
    redirectUrl.searchParams.set("error", "config");
    redirectUrl.searchParams.set(
      "error_description",
      "Instagram credentials not configured"
    );
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const formData = new FormData();
    formData.append("client_id", INSTAGRAM_APP_ID);
    formData.append("client_secret", INSTAGRAM_APP_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", REDIRECT_URI);
    formData.append("code", code);

    const response = await fetch(
      "https://api.instagram.com/oauth/access_token",
      { method: "POST", body: formData }
    );
    const data = await response.json();

    if (!response.ok) {
      redirectUrl.searchParams.set("error", "token_exchange");
      redirectUrl.searchParams.set(
        "error_description",
        data.error_message || "Failed to exchange code for token"
      );
      return NextResponse.redirect(redirectUrl);
    }

    const accessToken = data.access_token as string;

    const userRes = await fetch(
      `https://graph.instagram.com/v24.0/me?fields=id,username,account_type,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
    );
    const userData = await userRes.json();

    const externalId = String(userData.id ?? data.user_id ?? "");
    const username = userData.username || `ig_${externalId}`;

    if (!externalId) {
      redirectUrl.searchParams.set("error", "no_user_id");
      redirectUrl.searchParams.set(
        "error_description",
        "Instagram did not return a user ID"
      );
      return NextResponse.redirect(redirectUrl);
    }
    const meta = {
      followers_count: userData.followers_count ?? null,
      media_count: userData.media_count ?? null,
      profile_picture_url: userData.profile_picture_url ?? null,
      account_type: userData.account_type ?? null,
    };

    const encryptedToken = encryptToken(accessToken);
    const handle = username.startsWith("@") ? username : `@${username}`;

    const existing = await prisma.socialAccount.findFirst({
      where: {
        creatorId,
        agencyId,
        platform: "instagram",
        externalId,
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
          platform: "instagram",
          handle,
          externalId,
          accessToken: encryptedToken,
          status: "active",
          meta,
        },
      });
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Instagram callback error:", err);
    redirectUrl.searchParams.set("error", "failed");
    redirectUrl.searchParams.set(
      "error_description",
      "An error occurred while connecting your account"
    );
    return NextResponse.redirect(redirectUrl);
  }
}
