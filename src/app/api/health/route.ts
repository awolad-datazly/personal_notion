import { NextResponse } from "next/server";

import { hasDatabaseUrl } from "@/db";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "personal-notion",
      time: new Date().toISOString(),
      databaseConfigured: hasDatabaseUrl(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
