import { formidable } from "formidable";
import fs from "fs";
import { supabaseAdmin } from "../../../lib/supabase";
import { requireCustomer } from "../../../lib/auth";

export const config = {
  api: { bodyParser: false }
};

const KIND_CONFIG = {
  memory: { folder: "memories", maxBytes: 15 * 1024 * 1024, needsSlot: true, slotCount: 11 },
  gallery: { folder: "gallery", maxBytes: 15 * 1024 * 1024, needsSlot: true, slotCount: 4 },
  music: { folder: "music", maxBytes: 25 * 1024 * 1024, needsSlot: false },
  video: { folder: "video", maxBytes: 200 * 1024 * 1024, needsSlot: false },
  video_cover: { folder: "video", maxBytes: 15 * 1024 * 1024, needsSlot: false }
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, maxFileSize: 200 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  const session = requireCustomer(req, res);
  if (!session) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let fields, files;
  try {
    ({ fields, files } = await parseForm(req));
  } catch {
    return res.status(400).json({ error: "Could not read upload" });
  }

  const kind = Array.isArray(fields.kind) ? fields.kind[0] : fields.kind;
  const slotRaw = Array.isArray(fields.slot) ? fields.slot[0] : fields.slot;
  const cfg = KIND_CONFIG[kind];

  if (!cfg) return res.status(400).json({ error: "Invalid upload kind" });

  const slot = cfg.needsSlot ? parseInt(slotRaw, 10) : null;
  if (cfg.needsSlot && (Number.isNaN(slot) || slot < 0 || slot >= cfg.slotCount)) {
    return res.status(400).json({ error: "Invalid slot" });
  }

  const file = Array.isArray(files.file) ? files.file[0] : files.file;
  if (!file) return res.status(400).json({ error: "No file provided" });
  if (file.size > cfg.maxBytes) {
    return res.status(400).json({ error: "File is too large" });
  }

  const db = supabaseAdmin();
  const bucket = db.storage.from(process.env.SUPABASE_STORAGE_BUCKET);

  const ext = (file.originalFilename || "").split(".").pop() || "bin";
  const filename = `${kind}${cfg.needsSlot ? `-${slot}` : ""}-${Date.now()}.${ext}`;
  const storagePath = `customers/${session.customerId}/${cfg.folder}/${filename}`;

  const buffer = fs.readFileSync(file.filepath);
  const { error: uploadError } = await bucket.upload(storagePath, buffer, {
    contentType: file.mimetype || undefined,
    upsert: false
  });

  if (uploadError) return res.status(500).json({ error: "Upload failed" });

  const { data: publicUrlData } = bucket.getPublicUrl(storagePath);
  const url = publicUrlData.publicUrl;

  // Update the customer row to point at the new file, and remove the
  // old file it replaces (if any) so storage doesn't accumulate junk.
  const { data: current, error: fetchError } = await db
    .from("customers")
    .select("memory_images, gallery_images, music_url, video_url, video_cover_url")
    .eq("id", session.customerId)
    .maybeSingle();

  if (fetchError || !current) return res.status(500).json({ error: "Server error" });

  const oldPathsToRemove = [];
  const updates = {};

  if (kind === "memory") {
    const images = [...(current.memory_images || [])];
    if (images[slot]?.url) oldPathsToRemove.push(urlToStoragePath(images[slot].url));
    images[slot] = { ...images[slot], url };
    updates.memory_images = images;
  } else if (kind === "gallery") {
    const images = [...(current.gallery_images || [])];
    if (images[slot]?.url) oldPathsToRemove.push(urlToStoragePath(images[slot].url));
    images[slot] = { ...images[slot], url };
    updates.gallery_images = images;
  } else if (kind === "music") {
    if (current.music_url) oldPathsToRemove.push(urlToStoragePath(current.music_url));
    updates.music_url = url;
  } else if (kind === "video") {
    if (current.video_url) oldPathsToRemove.push(urlToStoragePath(current.video_url));
    updates.video_url = url;
  } else if (kind === "video_cover") {
    if (current.video_cover_url) oldPathsToRemove.push(urlToStoragePath(current.video_cover_url));
    updates.video_cover_url = url;
  }

  const { data: updated, error: updateError } = await db
    .from("customers")
    .update(updates)
    .eq("id", session.customerId)
    .select("*")
    .maybeSingle();

  if (updateError) return res.status(500).json({ error: "Could not save upload" });

  const validOldPaths = oldPathsToRemove.filter(Boolean);
  if (validOldPaths.length > 0) await bucket.remove(validOldPaths);

  delete updated.password_hash;
  return res.status(200).json({ customer: updated, url });
}

function urlToStoragePath(publicUrl) {
  const marker = `/${process.env.SUPABASE_STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
