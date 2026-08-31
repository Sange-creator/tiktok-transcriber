import { NextRequest, NextResponse } from "next/server";
import { extractTikTokMetadata } from "@/lib/extractor";
import { isValidTikTokUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string" || !isValidTikTokUrl(url)) {
      return NextResponse.json(
        { error: "Invalid TikTok URL provided" },
        { status: 400 }
      );
    }

    const metadata = await extractTikTokMetadata(url.trim());
    return NextResponse.json({ success: true, metadata });
  } catch (error: any) {
    console.error("Extract Info error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract TikTok information" },
      { status: 500 }
    );
  }
}
