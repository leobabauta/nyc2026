import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const KEY = "trip-state";

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ checked: [], notes: {} });
  }

  try {
    const data = await redis.get(KEY);
    return NextResponse.json(data || { checked: [], notes: {} });
  } catch (err) {
    return NextResponse.json({ checked: [], notes: {}, error: err.message });
  }
}

export async function POST(request) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "No KV configured" }, { status: 501 });
  }

  try {
    const body = await request.json();
    await redis.set(KEY, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
