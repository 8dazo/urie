import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorReason = searchParams.get("error_reason");
    const errorDescription = searchParams.get("error_description");

    if (error) {
        return NextResponse.json(
            { error, errorReason, errorDescription },
            { status: 400 }
        );
    }

    if (!code) {
        return NextResponse.json(
            { error: "No authorization code provided" },
            { status: 400 }
        );
    }

    const INSTAGRAM_APP_ID = process.env.AUTH_INSTAGRAM_ID;
    const INSTAGRAM_APP_SECRET = process.env.AUTH_INSTAGRAM_SECRET;
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/instagram/callback`;

    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
        return NextResponse.json(
            { error: "Instagram credentials not configured" },
            { status: 500 }
        );
    }

    try {
        const formData = new FormData();
        formData.append("client_id", INSTAGRAM_APP_ID);
        formData.append("client_secret", INSTAGRAM_APP_SECRET);
        formData.append("grant_type", "authorization_code");
        formData.append("redirect_uri", REDIRECT_URI);
        formData.append("code", code);

        const response = await fetch("https://api.instagram.com/oauth/access_token", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        // Success! We have the access token.
        console.log("Instagram Token Exchange Data:", data);

        // Redirect to Integrations > Instagram with token in query params
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
        const successUrl = new URL("/integrations/instagram", baseUrl);

        // Ensure we are not setting undefined values
        if (data.access_token) {
            successUrl.searchParams.set("access_token", data.access_token);
        }
        if (data.user_id) {
            successUrl.searchParams.set("user_id", data.user_id);
        }

        return NextResponse.redirect(successUrl);

    } catch (err) {
        console.error("Token exchange failed", err);
        return NextResponse.json(
            { error: "Token exchange failed" },
            { status: 500 }
        );
    }
}
