import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const maxWidth = searchParams.get("maxWidth") || "400";

  if (!name) {
    return NextResponse.json({ error: "Missing name param" }, { status: 400 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Server misconfigured: no Places API key" },
      { status: 500 }
    );
  }

  const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidth}&skipHttpRedirect=true&key=${key}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.photoUri) {
      return NextResponse.json(
        { error: "No photoUri returned" },
        { status: 502 }
      );
    }

    const imageRes = await fetch(data.photoUri);
    const imageBuffer = await imageRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": imageRes.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
