import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const flightIata = searchParams.get("flight");
  const flightDate = searchParams.get("date");

  if (!flightIata || !flightDate) {
    return NextResponse.json({ error: "Missing flight or date" }, { status: 400 });
  }

  const key = process.env.AVIATIONSTACK_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "No flight API key configured" }, { status: 501 });
  }

  // Free tier doesn't support flight_date param, so we fetch by flight number
  // and filter results by date ourselves
  const url = `http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=${flightIata}`;

  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 502 });
    }

    // Find the flight matching our date
    const flight = data.data?.find((f) => f.flight_date === flightDate);
    if (!flight) {
      return NextResponse.json({ status: "scheduled", message: "No live data yet" });
    }

    return NextResponse.json({
      status: flight.flight_status,
      departure: {
        scheduled: flight.departure?.scheduled,
        estimated: flight.departure?.estimated,
        actual: flight.departure?.actual,
        delay: flight.departure?.delay,
        gate: flight.departure?.gate,
        terminal: flight.departure?.terminal,
      },
      arrival: {
        scheduled: flight.arrival?.scheduled,
        estimated: flight.arrival?.estimated,
        actual: flight.arrival?.actual,
        delay: flight.arrival?.delay,
        gate: flight.arrival?.gate,
        terminal: flight.arrival?.terminal,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
