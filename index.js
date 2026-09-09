import Link from "next/link";

export default function Home() {
  return (
    <div className="zekra-dashboard">
      <div className="zekra-center-screen">
        <div className="zekra-panel" style={{ textAlign: "center", maxWidth: 420 }}>
          <div className="zekra-wordmark" style={{ fontSize: 34, marginBottom: 8 }}>
            ZEKRA
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 28 }}>
            Personalized love story websites.
          </p>
          <div className="zekra-row" style={{ justifyContent: "center" }}>
            <Link href="/login" className="zekra-btn primary">
              Customer login
            </Link>
            <Link href="/admin/login" className="zekra-btn">
              Admin login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
