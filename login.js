import { supabaseAdmin } from "../../../lib/supabase";
import { verifyPassword, issueCustomerSession } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const db = supabaseAdmin();
  const { data: customer, error } = await db
    .from("customers")
    .select("id, username, password_hash, slug")
    .eq("username", username)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Server error" });
  if (!customer) return res.status(401).json({ error: "Incorrect username or password" });

  const ok = await verifyPassword(password, customer.password_hash);
  if (!ok) return res.status(401).json({ error: "Incorrect username or password" });

  issueCustomerSession(res, customer);
  return res.status(200).json({ ok: true, slug: customer.slug });
}
