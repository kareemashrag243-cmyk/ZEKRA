import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCustomerSession } from "../../lib/auth";
import { api } from "../../lib/api";

export async function getServerSideProps({ req }) {
  const session = getCustomerSession(req);
  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: {} };
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");
  const [savedNote, setSavedNote] = useState("");

  async function load() {
    try {
      const { customer } = await api("/api/customer/me");
      setCustomer(customer);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await api("/api/customer/logout", { method: "POST" });
    router.push("/login");
  }

  function flash(msg) {
    setSavedNote(msg);
    setTimeout(() => setSavedNote(""), 2000);
  }

  if (error) {
    return (
      <div className="zekra-dashboard">
        <div className="zekra-center-screen">
          <div className="zekra-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="zekra-dashboard">
        <div className="zekra-center-screen" style={{ color: "var(--muted)" }}>
          Loading…
        </div>
      </div>
    );
  }

  const siteUrl = typeof window !== "undefined" ? `${window.location.origin}/customer/${customer.slug}` : "";

  return (
    <div className="zekra-dashboard">
      <div className="zekra-topbar">
        <div className="zekra-wordmark">ZEKRA</div>
        <div className="zekra-row">
          <div className="zekra-role">{customer.customer_name}</div>
          <button className="zekra-btn small" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div className="zekra-main">
        <div className="zekra-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <h1 style={{ fontSize: 28 }}>Your website</h1>
          <a className="zekra-btn" href={siteUrl} target="_blank" rel="noreferrer">
            Open website
          </a>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8, wordBreak: "break-all" }}>{siteUrl}</p>
        {savedNote && <div className="zekra-success">{savedNote}</div>}

        <CoupleInfoPanel customer={customer} onSaved={(c) => { setCustomer(c); flash("Saved"); }} />
        <BeginningPanel customer={customer} onSaved={(c) => { setCustomer(c); flash("Saved"); }} />
        <MemoryPanel customer={customer} onSaved={(c) => { setCustomer(c); flash("Saved"); }} />
        <GalleryPanel customer={customer} onSaved={(c) => { setCustomer(c); flash("Saved"); }} />
        <MusicPanel customer={customer} onSaved={(c) => { setCustomer(c); flash("Saved"); }} />
        <VideoPanel customer={customer} onSaved={(c) => { setCustomer(c); flash("Saved"); }} />
        <LetterPanel customer={customer} onSaved={(c) => { setCustomer(c); flash("Saved"); }} />
        <FinalPanel customer={customer} onSaved={(c) => { setCustomer(c); flash("Saved"); }} />
        <PasswordPanel />
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, textarea }) {
  return (
    <div className="zekra-field">
      <label>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function SavePanel({ title, children, onSave, saving }) {
  return (
    <div className="zekra-panel">
      <div className="zekra-section-title">{title}</div>
      {children}
      <button className="zekra-btn primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function CoupleInfoPanel({ customer, onSaved }) {
  const [boy, setBoy] = useState(customer.boy_name || "");
  const [girl, setGirl] = useState(customer.girl_name || "");
  const [year, setYear] = useState(customer.story_year || "");
  const [date, setDate] = useState(customer.relationship_start_date ? customer.relationship_start_date.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const { customer: updated } = await api("/api/customer/update", {
        method: "PUT",
        body: {
          boy_name: boy,
          girl_name: girl,
          story_year: year,
          relationship_start_date: date ? new Date(date).toISOString() : null
        }
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SavePanel title="Couple information" onSave={save} saving={saving}>
      <TextField label="Boy's name" value={boy} onChange={setBoy} />
      <TextField label="Girl's name" value={girl} onChange={setGirl} />
      <TextField label="Story year" value={year} onChange={setYear} />
      <div className="zekra-field">
        <label>Relationship start date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {error && <div className="zekra-error">{error}</div>}
    </SavePanel>
  );
}

function BeginningPanel({ customer, onSaved }) {
  const [title, setTitle] = useState(customer.beginning_title || "");
  const [description, setDescription] = useState(customer.beginning_description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const { customer: updated } = await api("/api/customer/update", {
        method: "PUT",
        body: { beginning_title: title, beginning_description: description }
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SavePanel title="Beginning section" onSave={save} saving={saving}>
      <TextField label="Beginning title (use a new line for a line break)" value={title} onChange={setTitle} textarea />
      <TextField label="Beginning description" value={description} onChange={setDescription} textarea />
      {error && <div className="zekra-error">{error}</div>}
    </SavePanel>
  );
}

function MemoryPanel({ customer, onSaved }) {
  const [images, setImages] = useState(customer.memory_images || []);
  const [error, setError] = useState("");
  const [busySlot, setBusySlot] = useState(null);

  useEffect(() => setImages(customer.memory_images || []), [customer.memory_images]);

  async function upload(slot, file) {
    setBusySlot(slot);
    setError("");
    try {
      const form = new FormData();
      form.append("kind", "memory");
      form.append("slot", slot);
      form.append("file", file);
      const { customer: updated } = await api("/api/customer/upload", { method: "POST", body: form });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusySlot(null);
    }
  }

  async function remove(slot) {
    setBusySlot(slot);
    setError("");
    try {
      const { customer: updated } = await api("/api/customer/delete-file", { method: "POST", body: { kind: "memory", slot } });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusySlot(null);
    }
  }

  async function move(slot, direction) {
    const next = [...images];
    const swapWith = slot + direction;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[slot], next[swapWith]] = [next[swapWith], next[slot]];
    setImages(next);
    try {
      const { customer: updated } = await api("/api/customer/update", {
        method: "PUT",
        body: { memory_order: next.map((n) => n.url) }
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="zekra-panel">
      <div className="zekra-section-title">Memory cards (11 slots)</div>
      <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 16 }}>
        These appear in the swipeable card stack, in this order. Use the arrows to reorder.
      </p>
      {error && <div className="zekra-error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="zekra-slot-grid">
        {images.map((img, i) => (
          <div className="zekra-slot" key={i}>
            {img?.url ? <img src={img.url} alt={`Memory ${i + 1}`} /> : <div className="zekra-slot-empty">Slot {i + 1}</div>}
            <div className="zekra-slot-actions">
              <label>
                {busySlot === i ? "…" : "Upload"}
                <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && upload(i, e.target.files[0])} />
              </label>
              {img?.url && (
                <button onClick={() => remove(i)} disabled={busySlot === i}>
                  Remove
                </button>
              )}
              <button onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button onClick={() => move(i, 1)} disabled={i === images.length - 1}>
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryPanel({ customer, onSaved }) {
  const [images, setImages] = useState(customer.gallery_images || []);
  const [error, setError] = useState("");
  const [busySlot, setBusySlot] = useState(null);
  const [savingCaptions, setSavingCaptions] = useState(false);

  useEffect(() => setImages(customer.gallery_images || []), [customer.gallery_images]);

  async function upload(slot, file) {
    setBusySlot(slot);
    setError("");
    try {
      const form = new FormData();
      form.append("kind", "gallery");
      form.append("slot", slot);
      form.append("file", file);
      const { customer: updated } = await api("/api/customer/upload", { method: "POST", body: form });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusySlot(null);
    }
  }

  async function remove(slot) {
    setBusySlot(slot);
    setError("");
    try {
      const { customer: updated } = await api("/api/customer/delete-file", { method: "POST", body: { kind: "gallery", slot } });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusySlot(null);
    }
  }

  function setCaption(slot, caption) {
    setImages((imgs) => imgs.map((img, i) => (i === slot ? { ...img, caption } : img)));
  }

  async function saveCaptions() {
    setSavingCaptions(true);
    setError("");
    try {
      const { customer: updated } = await api("/api/customer/update", {
        method: "PUT",
        body: { gallery_captions: images.map((i) => i.caption || "") }
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCaptions(false);
    }
  }

  return (
    <div className="zekra-panel">
      <div className="zekra-section-title">Gallery (4 photos)</div>
      {error && <div className="zekra-error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="zekra-slot-grid" style={{ marginBottom: 16 }}>
        {images.map((img, i) => (
          <div key={i}>
            <div className="zekra-slot">
              {img?.url ? <img src={img.url} alt={`Gallery ${i + 1}`} /> : <div className="zekra-slot-empty">Photo {i + 1}</div>}
              <div className="zekra-slot-actions">
                <label>
                  {busySlot === i ? "…" : "Upload"}
                  <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && upload(i, e.target.files[0])} />
                </label>
                {img?.url && (
                  <button onClick={() => remove(i)} disabled={busySlot === i}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              placeholder="Caption"
              value={img?.caption || ""}
              onChange={(e) => setCaption(i, e.target.value)}
              style={{ width: "100%", marginTop: 6, background: "rgba(255,255,255,.04)", border: "1px solid var(--line)", color: "var(--text)", padding: "8px 10px", fontSize: 12 }}
            />
          </div>
        ))}
      </div>
      <button className="zekra-btn primary" onClick={saveCaptions} disabled={savingCaptions}>
        {savingCaptions ? "Saving captions…" : "Save captions"}
      </button>
    </div>
  );
}

function MusicPanel({ customer, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("kind", "music");
      form.append("file", file);
      const { customer: updated } = await api("/api/customer/upload", { method: "POST", body: form });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="zekra-panel">
      <div className="zekra-section-title">Music</div>
      {customer.music_url && (
        <audio controls src={customer.music_url} style={{ width: "100%", marginBottom: 14 }} />
      )}
      <label className="zekra-btn">
        {busy ? "Uploading…" : customer.music_url ? "Replace music" : "Upload music"}
        <input type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
      </label>
      {error && <div className="zekra-error">{error}</div>}
    </div>
  );
}

function VideoPanel({ customer, onSaved }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function upload(kind, file) {
    setBusy(kind);
    setError("");
    try {
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file);
      const { customer: updated } = await api("/api/customer/upload", { method: "POST", body: form });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="zekra-panel">
      <div className="zekra-section-title">Video</div>
      {customer.video_url && (
        <video controls src={customer.video_url} poster={customer.video_cover_url || undefined} style={{ width: "100%", marginBottom: 14 }} />
      )}
      <div className="zekra-row">
        <label className="zekra-btn">
          {busy === "video" ? "Uploading…" : customer.video_url ? "Replace video" : "Upload video"}
          <input type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => e.target.files[0] && upload("video", e.target.files[0])} />
        </label>
        <label className="zekra-btn">
          {busy === "video_cover" ? "Uploading…" : customer.video_cover_url ? "Replace cover image" : "Upload cover image"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files[0] && upload("video_cover", e.target.files[0])} />
        </label>
      </div>
      {error && <div className="zekra-error">{error}</div>}
    </div>
  );
}

function LetterPanel({ customer, onSaved }) {
  const [letter_text, setLetter] = useState(customer.letter_text || "");
  const [signature, setSignature] = useState(customer.signature || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const { customer: updated } = await api("/api/customer/update", { method: "PUT", body: { letter_text, signature } });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SavePanel title="Letter" onSave={save} saving={saving}>
      <TextField label="Letter text" value={letter_text} onChange={setLetter} textarea />
      <TextField label="Signature" value={signature} onChange={setSignature} />
      {error && <div className="zekra-error">{error}</div>}
    </SavePanel>
  );
}

function FinalPanel({ customer, onSaved }) {
  const [final_text, setFinal] = useState(customer.final_text || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const { customer: updated } = await api("/api/customer/update", { method: "PUT", body: { final_text } });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SavePanel title="Final section" onSave={save} saving={saving}>
      <TextField label="Closing line" value={final_text} onChange={setFinal} />
      {error && <div className="zekra-error">{error}</div>}
    </SavePanel>
  );
}

function PasswordPanel() {
  const [current_password, setCurrent] = useState("");
  const [new_password, setNewPw] = useState("");
  const [confirm_new_password, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await api("/api/customer/change-password", { method: "POST", body: { current_password, new_password, confirm_new_password } });
      setSuccess("Password changed");
      setCurrent("");
      setNewPw("");
      setConfirm("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SavePanel title="Change password" onSave={save} saving={saving}>
      <div className="zekra-field">
        <label>Current password</label>
        <input type="password" value={current_password} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="zekra-field">
        <label>New password</label>
        <input type="password" value={new_password} onChange={(e) => setNewPw(e.target.value)} />
      </div>
      <div className="zekra-field">
        <label>Confirm new password</label>
        <input type="password" value={confirm_new_password} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && <div className="zekra-error">{error}</div>}
      {success && <div className="zekra-success">{success}</div>}
    </SavePanel>
  );
}
