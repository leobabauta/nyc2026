import { NextResponse } from "next/server";

// WMO weather codes → simple descriptions
const weatherDescriptions = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Icy fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Heavy freezing rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  77: "Snow grains", 80: "Light showers", 81: "Showers", 82: "Heavy showers",
  85: "Light snow showers", 86: "Snow showers",
  95: "Thunderstorm", 96: "Thunderstorm + hail", 99: "Severe thunderstorm",
};

const weatherIcons = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌧️", 55: "🌧️",
  61: "🌦️", 63: "🌧️", 65: "🌧️",
  66: "🌧️", 67: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️",
  77: "🌨️", 80: "🌦️", 81: "🌧️", 82: "🌧️",
  85: "🌨️", 86: "🌨️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

export async function GET() {
  // NYC coordinates, Apr 4–11 2026
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&temperature_unit=fahrenheit&timezone=America/New_York&start_date=2026-04-04&end_date=2026-04-11";

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (!data.daily) {
      return NextResponse.json({ error: "No forecast data" }, { status: 502 });
    }

    const forecasts = data.daily.time.map((date, i) => ({
      date,
      high: Math.round(data.daily.temperature_2m_max[i]),
      low: Math.round(data.daily.temperature_2m_min[i]),
      precipChance: data.daily.precipitation_probability_max[i],
      weatherCode: data.daily.weather_code[i],
      description: weatherDescriptions[data.daily.weather_code[i]] || "Unknown",
      icon: weatherIcons[data.daily.weather_code[i]] || "🌡️",
    }));

    return NextResponse.json({ forecasts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
