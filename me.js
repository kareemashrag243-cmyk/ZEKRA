import { supabaseAdmin } from "../../../lib/supabase";
import { requireCustomer } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = requireCustomer(req, res);
  if (!session) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("customers")
    .select("*")
    .eq("id", session.customerId)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Server error" });
  if (!data) return res.status(404).json({ error: "Not found" });

  delete data.password_hash;
  return res.status(200).json({ customer: data });
}
