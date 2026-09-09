import { supabaseAdmin } from "../../../lib/supabase";
import { requireCustomer } from "../../../lib/auth";

const TEXT_FIELDS = [
  "boy_name",
  "girl_name",
  "story_year",
  "relationship_start_date",
  "beginning_title",
  "beginning_description",
  "letter_text",
  "signature",
  "final_text"
];

export default async function handler(req, res) {
  const session = requireCustomer(req, res);
  if (!session) return;
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};
  const updates = {};

  for (const field of TEXT_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  // Gallery captions: expects an array of 4 { url, caption } objects.
  // Only the caption text is trusted from the client here — image
  // urls are only ever set by /api/customer/upload.
  if (Array.isArray(body.gallery_captions)) {
    const db = supabaseAdmin();
    const { data: current } = await db
      .from("customers")
      .select("gallery_images")
      .eq("id", session.customerId)
      .maybeSingle();

    const existing = current?.gallery_images || [];
    updates.gallery_images = existing.map((item, i) => ({
      ...item,
      caption: typeof body.gallery_captions[i] === "string" ? body.gallery_captions[i] : item.caption
    }));
  }

  // Memory image order: expects an array of the 11 existing image
  // objects in the customer's desired order. We only accept a
  // reordering of URLs that already belong to this customer.
  if (Array.isArray(body.memory_order)) {
    const db = supabaseAdmin();
    const { data: current } = await db
      .from("customers")
      .select("memory_images")
      .eq("id", session.customerId)
      .maybeSingle();

    const existingUrls = new Set((current?.memory_images || []).map((m) => m.url));
    const validReorder =
      body.memory_order.length === (current?.memory_images || []).length &&
      body.memory_order.every((url) => existingUrls.has(url));

    if (validReorder) {
      updates.memory_images = body.memory_order.map((url, i) => ({ url, position: i }));
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No editable fields provided" });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("customers")
    .update(updates)
    .eq("id", session.customerId)
    .select("*")
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not save changes" });

  delete data.password_hash;
  return res.status(200).json({ customer: data });
}
