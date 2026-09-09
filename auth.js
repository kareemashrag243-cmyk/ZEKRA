import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_COOKIE = "zekra_admin_session";
const CUSTOMER_COOKIE = "zekra_customer_session";
const SESSION_DAYS = 7;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function sign(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: `${SESSION_DAYS}d` });
}

function verify(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

function cookieString(name, value, maxAgeSeconds) {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

function clearCookieString(name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

// ---- Admin session ----

export function issueAdminSession(res, admin) {
  const token = sign({ adminId: admin.id, username: admin.username }, process.env.ADMIN_JWT_SECRET);
  res.setHeader("Set-Cookie", cookieString(ADMIN_COOKIE, token, SESSION_DAYS * 86400));
}

export function clearAdminSession(res) {
  res.setHeader("Set-Cookie", clearCookieString(ADMIN_COOKIE));
}

export function getAdminSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[ADMIN_COOKIE];
  if (!token) return null;
  return verify(token, process.env.ADMIN_JWT_SECRET);
}

// ---- Customer session ----

export function issueCustomerSession(res, customer) {
  const token = sign(
    { customerId: customer.id, username: customer.username, slug: customer.slug },
    process.env.CUSTOMER_JWT_SECRET
  );
  res.setHeader("Set-Cookie", cookieString(CUSTOMER_COOKIE, token, SESSION_DAYS * 86400));
}

export function clearCustomerSession(res) {
  res.setHeader("Set-Cookie", clearCookieString(CUSTOMER_COOKIE));
}

export function getCustomerSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[CUSTOMER_COOKIE];
  if (!token) return null;
  return verify(token, process.env.CUSTOMER_JWT_SECRET);
}

// ---- Guards for API routes ----

export function requireAdmin(req, res) {
  const session = getAdminSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return session;
}

export function requireCustomer(req, res) {
  const session = getCustomerSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return session;
}
