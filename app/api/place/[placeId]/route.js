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

  const url = `https://places.googleapis.com/v1/places/${placeId}?key=${key}`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Goog-FieldMask":
          "displayName,formattedAddress,rating,userRatingCount,currentOpeningHours,websiteUri,nationalPhoneNumber,photos",
      },
      next: { revalidate: 3600 },
    });
    const r = await res.json();

    if (r.error) {
      return NextResponse.json(
        { error: r.error.message || r.error.status },
        { status: 502 }
      );
    }

    return NextResponse.json({
      name: r.displayName?.text,
      address: r.formattedAddress,
      rating: r.rating,
      totalRatings: r.userRatingCount,
      openNow: r.currentOpeningHours?.openNow,
      weekdayText: r.currentOpeningHours?.weekdayDescriptions,
      website: r.websiteUri,
      phone: r.nationalPhoneNumber,
      photos: (r.photos ?? []).slice(0, 6).map((p) => p.name),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
