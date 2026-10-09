// Stockage partagé du plan du CDI (Netlify Blobs).
// Routes :
//   GET    /api/state            -> { catalog, layouts:[{name, savedAt, count}] }
//   PUT    /api/catalog          <- { catalog:[...] }
//   GET    /api/layouts/:nom     -> { name, savedAt, items, types }
//   PUT    /api/layouts/:nom     <- { items:[...], types:[...] }
//   DELETE /api/layouts/:nom
import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const MAX_BYTES = 2_000_000;

export default async (req) => {
  const store = getStore({ name: "cdi-plan", consistency: "strong" });
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [res, name] = parts;

  try {
    if (res === "state" && req.method === "GET") {
      const catalog = await store.get("catalog", { type: "json" });
      const { blobs } = await store.list({ prefix: "layout/" });
      const layouts = await Promise.all(
        blobs.map(async (b) => {
          const m = await store.getMetadata(b.key);
          const md = (m && m.metadata) || {};
          return { name: md.name || decodeURIComponent(b.key.slice(7)), savedAt: md.savedAt || null, count: md.count ?? null };
        })
      );
      layouts.sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
      return json({ catalog: Array.isArray(catalog) ? catalog : null, layouts });
    }

    if (res === "catalog" && req.method === "PUT") {
      const text = await req.text();
      if (text.length > MAX_BYTES) return json({ error: "Catalogue trop volumineux" }, 413);
      const body = JSON.parse(text);
      if (!Array.isArray(body.catalog)) return json({ error: "Catalogue invalide" }, 400);
      await store.setJSON("catalog", body.catalog);
      return json({ ok: true });
    }

    if (res === "layouts" && name) {
      const clean = name.trim().slice(0, 60);
      if (!clean) return json({ error: "Nom manquant" }, 400);
      const key = "layout/" + encodeURIComponent(clean);

      if (req.method === "GET") {
        const d = await store.get(key, { type: "json" });
        return d ? json(d) : json({ error: "Disposition introuvable" }, 404);
      }
      if (req.method === "PUT") {
        const text = await req.text();
        if (text.length > MAX_BYTES) return json({ error: "Disposition trop volumineuse" }, 413);
        const body = JSON.parse(text);
        if (!Array.isArray(body.items)) return json({ error: "Disposition invalide" }, 400);
        const savedAt = new Date().toISOString();
        await store.setJSON(
          key,
          { name: clean, savedAt, items: body.items, types: Array.isArray(body.types) ? body.types : [] },
          { metadata: { name: clean, savedAt, count: body.items.length } }
        );
        return json({ ok: true, savedAt });
      }
      if (req.method === "DELETE") {
        await store.delete(key);
        return json({ ok: true });
      }
    }

    return json({ error: "Route inconnue" }, 404);
  } catch (e) {
    return json({ error: String((e && e.message) || e) }, 500);
  }
};

export const config = { path: "/api/*" };
