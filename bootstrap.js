import { supabaseAdmin } from "../../../lib/supabase";
import { hashPassword } from "../../../lib/auth";

// Visit this route ONCE (in the browser or with curl) after deploying,
// to create your first admin account from ADMIN_BOOTSTRAP_USERNAME /
// ADMIN_BOOTSTRAP_PASSWORD in your environment variables.
//
// It refuses to run if an admin already exists, so it's safe to leave
// this file in place — it can't be used to create a second admin or
// take over an existing one.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = supabaseAdmin();

  const { count, error: countError } = await db
    .from("admins")
    .select("id", { count: "exact", head: true });

  if (countError) return res.status(500).json({ error: "Server error" });
  if (count > 0) {
    return res.status(403).json({ error: "An admin account already exists. Bootstrap is disabled." });
  }

  const username = process.env.ADMIN_BOOTSTRAP_USERNAME;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!username || !password) {
    return res.status(500).json({ error: "ADMIN_BOOTSTRAP_USERNAME / ADMIN_BOOTSTRAP_PASSWORD not set" });
  }

  const password_hash = await hashPassword(password);
  const { error } = await db.from("admins").insert({ username, password_hash });
  if (error) return res.status(500).json({ error: "Could not create admin" });

  return res.status(200).json({ ok: true, message: "Admin created. You can now log in — consider removing the bootstrap credentials from your env vars." });
}
