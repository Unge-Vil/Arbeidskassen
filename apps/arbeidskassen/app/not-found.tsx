import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="nb">
      <body style={{ margin: 0 }}>
        <div
          className="flex min-h-screen items-center justify-center px-4"
          style={{
            background: "#f4f5f5",
            fontFamily:
              'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              textAlign: "center",
              padding: "2rem",
              borderRadius: "1rem",
              border: "1px solid #e5e7eb",
              background: "#fdfdfd",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <p
              style={{
                fontSize: "3rem",
                fontWeight: 700,
                color: "#64748b",
                margin: "0 0 0.5rem",
              }}
            >
              404
            </p>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#1a1f2e",
                margin: "0 0 0.5rem",
              }}
            >
              Siden finnes ikke
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 1.5rem" }}>
              Sjekk at adressen er riktig, eller gå tilbake til forsiden.
            </p>
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#ffffff",
                background: "#4F5DD6",
                textDecoration: "none",
              }}
            >
              Gå til forsiden
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
