import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "No API key" }, { status: 501 });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const loc = data.results[0].geometry.location;
    return NextResponse.json({ lat: loc.lat, lng: loc.lng });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
