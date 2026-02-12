import { NextResponse } from "next/server";

export async function GET() {
    const addToUrl = (url: string, params: Record<string, string>) => {
        const urlObj = new URL(url);
        Object.keys(params).forEach((key) =>
            urlObj.searchParams.append(key, params[key])
        );
        return urlObj.toString();
    };

    const INSTAGRAM_APP_ID = process.env.AUTH_INSTAGRAM_ID;
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/instagram/callback`;

    // Scopes required for business login
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

    const authUrl = addToUrl("https://www.instagram.com/oauth/authorize", {
        client_id: INSTAGRAM_APP_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: SCOPES,
    });

    return NextResponse.redirect(authUrl);
}
