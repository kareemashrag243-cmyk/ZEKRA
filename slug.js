import slugify from "slugify";

export async function makeUniqueSlug(db, baseText) {
  const base = slugify(baseText, { lower: true, strict: true }) || "couple";
  let candidate = base;
  let counter = 2;

  // Loop until we find a slug not already taken. Fine at this scale
  // (small business, low creation volume) — no need for anything fancier.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await db
      .from("customers")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate;

    candidate = `${base}-${counter}`;
    counter += 1;
  }
}
