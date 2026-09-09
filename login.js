import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../lib/api";

export default function CustomerLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/customer/login", { method: "POST", body: { username, password } });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="zekra-dashboard">
      <div className="zekra-center-screen">
        <form className="zekra-panel" style={{ width: 360 }} onSubmit={onSubmit}>
          <div className="zekra-section-title">ZEKRA</div>
          <h1 style={{ fontSize: 30, marginBottom: 24 }}>Sign in to your website</h1>

          <div className="zekra-field">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </div>

          <div className="zekra-field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="zekra-btn primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          {error && <div className="zekra-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
