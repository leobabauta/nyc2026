import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const dayIndex = formData.get("dayIndex");
  const lat = formData.get("lat");
  const lng = formData.get("lng");

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  try {
    const blob = await put(`trip-photos/day${dayIndex}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    return NextResponse.json({
      url: blob.url,
      dayIndex: Number(dayIndex),
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      filename: file.name,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
