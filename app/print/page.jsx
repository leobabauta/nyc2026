import { days, markerColors } from "@/data/itinerary";

const typeLabels = {
  anchor: "Booked",
  food: "Food",
  books: "Books",
  museum: "Museum",
  park: "Park",
  shopping: "Shopping",
};

export const metadata = {
  title: "Eva & Leo's NYC 2026 Trip — Printable Itinerary",
};

export default function PrintPage() {
  return (
    <div className="print-page">
      <style>{`
        @media print {
          @page { margin: 0.75in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        .print-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: Georgia, 'Times New Roman', serif;
          color: #111;
          background: #fff;
          line-height: 1.6;
        }
        .print-page h1 {
          font-size: 1.75rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        .print-page .subtitle {
          color: #666;
          margin-bottom: 2rem;
        }
        .print-page .day-section {
          margin-bottom: 2.5rem;
          page-break-inside: avoid;
        }
        .print-page .day-header {
          font-size: 1.25rem;
          font-weight: bold;
          border-bottom: 2px solid #333;
          padding-bottom: 0.25rem;
          margin-bottom: 0.5rem;
        }
        .print-page .day-narrative {
          font-style: italic;
          color: #555;
          margin-bottom: 1rem;
          font-size: 0.95rem;
        }
        .print-page ol {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .print-page .stop-item {
          padding: 0.4rem 0;
          border-bottom: 1px solid #e5e5e5;
          display: flex;
          gap: 0.5rem;
          align-items: baseline;
        }
        .print-page .stop-num {
          font-weight: bold;
          min-width: 1.5rem;
          text-align: right;
          flex-shrink: 0;
        }
        .print-page .stop-body {
          flex: 1;
        }
        .print-page .stop-name {
          font-weight: bold;
        }
        .print-page .badge {
          display: inline-block;
          font-size: 0.7rem;
          padding: 0.1rem 0.4rem;
          border-radius: 3px;
          vertical-align: middle;
          margin-left: 0.35rem;
          font-weight: normal;
          color: #fff;
        }
        .print-page .time-badge {
          color: #92400e;
          font-weight: 600;
          font-size: 0.85rem;
          margin-left: 0.5rem;
        }
        .print-page .stop-notes {
          color: #444;
          font-size: 0.9rem;
        }
        .print-page .map-link {
          font-size: 0.8rem;
          color: #2563eb;
          text-decoration: none;
          margin-left: 0.25rem;
        }
        .print-page .map-link:hover { text-decoration: underline; }
        @media print {
          .print-page .map-link { color: #333; }
          .print-page .map-link::after { content: " (" attr(href) ")"; font-size: 0.7rem; word-break: break-all; }
        }
        .print-page .print-btn {
          display: inline-block;
          padding: 0.5rem 1.25rem;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }
        .print-page .print-btn:hover { background: #333; }
      `}</style>

      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.addEventListener('click',function(e){if(e.target.classList.contains('print-btn'))window.print()})`,
        }}
      />
      <button type="button" className="print-btn no-print">
        Print this page
      </button>

      <h1>Eva &amp; Leo&apos;s NYC 2026 Trip</h1>
      <p className="subtitle">April 4 &ndash; 11, 2026 &middot; 8 days (incl. travel) &middot; {days.reduce((n, d) => n + d.stops.length, 0)} stops</p>

      {days.map((day, di) => (
        <section key={di} className="day-section">
          <h2 className="day-header">
            {day.label} &mdash; {day.date} &middot; {day.title}
          </h2>
          <p className="day-narrative">{day.narrative}</p>

          <ol>
            {day.stops.map((stop, stopIdx) => (
              <li key={stop.id} className="stop-item">
                <span className="stop-num">{stopIdx + 1}.</span>
                <span className="stop-body">
                  <span className="stop-name">{stop.name}</span>
                  <span
                    className="badge"
                    style={{ backgroundColor: markerColors[stop.type] || "#888" }}
                  >
                    {typeLabels[stop.type] || stop.type}
                  </span>
                  {stop.time && (
                    <span className="time-badge">⏰ {stop.time}</span>
                  )}
                  <br />
                  <span className="stop-notes">{stop.notes}</span>
                  {stop.placeId && (
                    <>
                      {" "}
                      <a
                        className="map-link"
                        href={`https://www.google.com/maps/place/?q=place_id:${stop.placeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Map ↗
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
