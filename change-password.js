import { supabaseAdmin } from "../../../lib/supabase";
import { requireCustomer, verifyPassword, hashPassword } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = requireCustomer(req, res);
  if (!session) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { current_password, new_password, confirm_new_password } = req.body || {};

  if (!current_password || !new_password || !confirm_new_password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (new_password !== confirm_new_password) {
    return res.status(400).json({ error: "New passwords do not match" });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  const db = supabaseAdmin();
  const { data: customer, error } = await db
    .from("customers")
    .select("password_hash")
    .eq("id", session.customerId)
    .maybeSingle();

  if (error || !customer) return res.status(500).json({ error: "Server error" });

  const ok = await verifyPassword(current_password, customer.password_hash);
  if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

  const password_hash = await hashPassword(new_password);
  const { error: updateError } = await db
    .from("customers")
    .update({ password_hash })
    .eq("id", session.customerId);

  if (updateError) return res.status(500).json({ error: "Could not change password" });

  return res.status(200).json({ ok: true });
}
