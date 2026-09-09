import { supabaseAdmin } from "../../../lib/supabase";
import { verifyPassword, issueAdminSession } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const db = supabaseAdmin();
  const { data: admin, error } = await db
    .from("admins")
    .select("id, username, password_hash")
    .eq("username", username)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Server error" });
  if (!admin) return res.status(401).json({ error: "Incorrect username or password" });

  const ok = await verifyPassword(password, admin.password_hash);
  if (!ok) return res.status(401).json({ error: "Incorrect username or password" });

  issueAdminSession(res, admin);
  return res.status(200).json({ ok: true });
}
