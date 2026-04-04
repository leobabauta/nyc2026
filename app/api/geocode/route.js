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

  // Use Places API Text Search instead of Geocoding API
  const url = `https://places.googleapis.com/v1/places:searchText`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.location,places.displayName",
      },
      body: JSON.stringify({ textQuery: address }),
      next: { revalidate: 86400 },
    });
    const data = await res.json();

    const place = data.places?.[0];
    if (!place?.location) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      lat: place.location.latitude,
      lng: place.location.longitude,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
