import { supabaseAdmin } from "../../../lib/supabase";
import { requireCustomer } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = requireCustomer(req, res);
  if (!session) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { kind, slot } = req.body || {};
  if (kind !== "memory" && kind !== "gallery") {
    return res.status(400).json({ error: "Invalid kind" });
  }

  const db = supabaseAdmin();
  const field = kind === "memory" ? "memory_images" : "gallery_images";

  const { data: current, error: fetchError } = await db
    .from("customers")
    .select(field)
    .eq("id", session.customerId)
    .maybeSingle();

  if (fetchError || !current) return res.status(500).json({ error: "Server error" });

  const images = [...(current[field] || [])];
  const idx = parseInt(slot, 10);
  if (Number.isNaN(idx) || idx < 0 || idx >= images.length) {
    return res.status(400).json({ error: "Invalid slot" });
  }

  const oldUrl = images[idx]?.url;
  images[idx] = kind === "gallery" ? { url: null, caption: images[idx]?.caption || "" } : { url: null, position: idx };

  const { data: updated, error: updateError } = await db
    .from("customers")
    .update({ [field]: images })
    .eq("id", session.customerId)
    .select("*")
    .maybeSingle();

  if (updateError) return res.status(500).json({ error: "Could not remove image" });

  if (oldUrl) {
    const marker = `/${process.env.SUPABASE_STORAGE_BUCKET}/`;
    const i = oldUrl.indexOf(marker);
    if (i !== -1) {
      const path = oldUrl.slice(i + marker.length);
      await db.storage.from(process.env.SUPABASE_STORAGE_BUCKET).remove([path]);
    }
  }

  delete updated.password_hash;
  return res.status(200).json({ customer: updated });
}
