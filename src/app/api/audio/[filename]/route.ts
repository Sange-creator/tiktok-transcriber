import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { getAudioDir } from "@/lib/extractor";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Security check: prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(getAudioDir(), safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Audio file not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(file);

      return new NextResponse(webStream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": `${chunksize}`,
          "Content-Type": "audio/mpeg",
        },
      });
    } else {
      const file = fs.createReadStream(filePath);
      const webStream = Readable.toWeb(file);

      return new NextResponse(webStream as any, {
        status: 200,
        headers: {
          "Content-Length": `${fileSize}`,
          "Content-Type": "audio/mpeg",
          "Accept-Ranges": "bytes",
        },
      });
    }
  } catch (error) {
    console.error("Audio stream error:", error);
    return new NextResponse("Internal server error streaming audio", {
      status: 500,
    });
  }
}
