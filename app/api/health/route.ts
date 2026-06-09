import { NextResponse } from "next/server";
import { getHealthSummary } from "@/lib/queries";
import { getRedisStatus } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await getHealthSummary();
    return NextResponse.json(health);
  } catch {
    const redis = await getRedisStatus();

    return NextResponse.json(
      {
        counts: {
          assignments: 0,
          cycles: 0,
          employees: 0,
          evaluations: 0,
        },
        mongo: "unavailable",
        redis,
        status: "error",
      },
      { status: 503 },
    );
  }
}
