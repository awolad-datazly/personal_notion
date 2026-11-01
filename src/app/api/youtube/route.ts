import { NextRequest, NextResponse } from "next/server";
import { extractYouTubeId, fetchYouTubeTitle } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawUrl = searchParams.get("url") || searchParams.get("id") || "";

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url or id parameter" }, { status: 400 });
  }

  const videoId = extractYouTubeId(rawUrl);
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL or ID" }, { status: 400 });
  }

  try {
    const title = await fetchYouTubeTitle(videoId);
    return NextResponse.json({
      videoId,
      title: title || "YouTube Study Session",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    });
  } catch {
    return NextResponse.json({
      videoId,
      title: "YouTube Study Session",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    });
  }
}
