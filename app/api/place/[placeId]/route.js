import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
  const { placeId } = params;

  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Server misconfigured: no Places API key" },
      { status: 500 }
    );
  }

  const fields = "name,formatted_address,rating,user_ratings_total,opening_hours,website,formatted_phone_number,photos";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: data.error_message || data.status },
        { status: 502 }
      );
    }

    const r = data.result;
    return NextResponse.json({
      name: r.name,
      address: r.formatted_address,
      rating: r.rating,
      totalRatings: r.user_ratings_total,
      openNow: r.opening_hours?.open_now,
      weekdayText: r.opening_hours?.weekday_text,
      website: r.website,
      phone: r.formatted_phone_number,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
