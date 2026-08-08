import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  },
});

const ALLOWED_MEDIA_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".ogg",
  ".ogv",
]);

function isAllowedMedia(file) {
  const mime = String(file.mimetype || "").toLowerCase();
  if (mime.startsWith("image/") || mime.startsWith("video/")) return true;
  // iOS / some browsers send empty or octet-stream for videos
  if (!mime || mime === "application/octet-stream") {
    const ext = path.extname(file.originalname || "").toLowerCase();
    return ALLOWED_MEDIA_EXT.has(ext);
  }
  return false;
}

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedMedia(file)) {
      return cb(new Error("Only images or videos are allowed"));
    }
    cb(null, true);
  },
});

async function getImages(listingId) {
  const [rows] = await pool.query(
    `SELECT id, path, sort_order FROM listing_images
     WHERE listing_id = ? ORDER BY sort_order ASC, id ASC`,
    [listingId]
  );
  return rows.map((r) => ({
    id: r.id,
    path: r.path,
    url: `/uploads/${r.path}`,
    sort_order: r.sort_order,
  }));
}

async function getAmenities(listingId) {
  const [rows] = await pool.query(
    `SELECT a.id, a.\`key\`, a.label_en, a.label_zh, a.icon
     FROM amenities a
     INNER JOIN listing_amenities la ON la.amenity_id = a.id
     WHERE la.listing_id = ?
     ORDER BY a.id ASC`,
    [listingId]
  );
  return rows;
}

function mapListing(row, images = [], amenities = [], { includeInternal = false } = {}) {
  const listing = {
    id: row.id,
    title_en: row.title_en,
    title_zh: row.title_zh,
    description_en: row.description_en,
    description_zh: row.description_zh,
    property_type: row.property_type,
    deal_type: row.deal_type,
    price_idr: Number(row.price_idr),
    area_sqm: Number(row.area_sqm),
    city: row.city,
    district: row.district,
    address: row.address,
    visibility: row.visibility,
    availability: row.availability,
    created_at: row.created_at,
    updated_at: row.updated_at,
    images,
    amenities,
  };

  if (includeInternal) {
    listing.source_name = row.source_name || "";
    listing.internal_note = row.internal_note || "";
  }

  return listing;
}

async function hydrateListing(row, options = {}) {
  const [images, amenities] = await Promise.all([
    getImages(row.id),
    getAmenities(row.id),
  ]);
  return mapListing(row, images, amenities, options);
}

function buildPublicFilters(query) {
  const where = ["visibility = 'published'"];
  const params = {};

  if (query.q) {
    where.push(
      `(title_en LIKE :q OR title_zh LIKE :q OR city LIKE :q OR district LIKE :q OR address LIKE :q)`
    );
    params.q = `%${query.q}%`;
  }
  if (query.city) {
    where.push("city = :city");
    params.city = query.city;
  }
  if (query.property_type) {
    where.push("property_type = :property_type");
    params.property_type = query.property_type;
  }
  if (query.deal_type) {
    where.push("deal_type = :deal_type");
    params.deal_type = query.deal_type;
  }
  if (query.availability) {
    where.push("availability = :availability");
    params.availability = query.availability;
  }
  if (query.min_price) {
    where.push("price_idr >= :min_price");
    params.min_price = Number(query.min_price);
  }
  if (query.max_price) {
    where.push("price_idr <= :max_price");
    params.max_price = Number(query.max_price);
  }
  if (query.min_area) {
    where.push("area_sqm >= :min_area");
    params.min_area = Number(query.min_area);
  }
  if (query.max_area) {
    where.push("area_sqm <= :max_area");
    params.max_area = Number(query.max_area);
  }

  return { where, params };
}

// ——— Public ———

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    const { where, params } = buildPublicFilters(req.query);

    const whereSql = where.join(" AND ");
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM listings WHERE ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM listings
       WHERE ${whereSql}
       ORDER BY FIELD(availability, 'open', 'closed'), updated_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const listings = await Promise.all(rows.map((row) => hydrateListing(row)));
    res.json({ listings, page, limit, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load listings" });
  }
});

router.get("/cities", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT city FROM listings
       WHERE visibility = 'published' AND city <> ''
       ORDER BY city ASC`
    );
    res.json({ cities: rows.map((r) => r.city) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load cities" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM listings WHERE id = ? AND visibility = 'published'`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Listing not found" });
    res.json({ listing: await hydrateListing(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load listing" });
  }
});

function validateListingBody(body, { partial = false } = {}) {
  const errors = [];
  const required = [
    "title_en",
    "title_zh",
    "description_en",
    "description_zh",
    "property_type",
    "deal_type",
    "price_idr",
    "area_sqm",
    "city",
  ];

  if (!partial) {
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        errors.push(`${key} is required`);
      }
    }
  }

  if (body.property_type && !["factory", "warehouse"].includes(body.property_type)) {
    errors.push("invalid property_type");
  }
  if (body.deal_type && !["rent", "sell"].includes(body.deal_type)) {
    errors.push("invalid deal_type");
  }
  if (body.visibility && !["draft", "published"].includes(body.visibility)) {
    errors.push("invalid visibility");
  }
  if (body.availability && !["open", "closed"].includes(body.availability)) {
    errors.push("invalid availability");
  }

  return errors;
}

async function syncAmenities(conn, listingId, amenityIds) {
  await conn.query("DELETE FROM listing_amenities WHERE listing_id = ?", [
    listingId,
  ]);
  if (!Array.isArray(amenityIds) || amenityIds.length === 0) return;
  for (const amenityId of amenityIds) {
    await conn.query(
      "INSERT INTO listing_amenities (listing_id, amenity_id) VALUES (?, ?)",
      [listingId, amenityId]
    );
  }
}

export const adminListingsRouter = Router();
adminListingsRouter.use(requireAuth);

adminListingsRouter.get("/", async (req, res) => {
  try {
    const q = req.query.q ? `%${req.query.q}%` : null;
    let sql = "SELECT * FROM listings";
    const params = [];
    if (q) {
      sql +=
        " WHERE title_en LIKE ? OR title_zh LIKE ? OR city LIKE ? OR district LIKE ? OR source_name LIKE ? OR internal_note LIKE ?";
      params.push(q, q, q, q, q, q);
    }
    sql += " ORDER BY updated_at DESC";
    const [rows] = await pool.query(sql, params);
    const listings = await Promise.all(
      rows.map((row) => hydrateListing(row, { includeInternal: true }))
    );
    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load listings" });
  }
});

adminListingsRouter.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM listings WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: "Listing not found" });
    res.json({
      listing: await hydrateListing(rows[0], { includeInternal: true }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load listing" });
  }
});

adminListingsRouter.post("/", async (req, res) => {
  const body = req.body || {};
  const errors = validateListingBody(body);
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO listings (
        title_en, title_zh, description_en, description_zh,
        property_type, deal_type, price_idr, area_sqm,
        city, district, address, visibility, availability,
        source_name, internal_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.title_en,
        body.title_zh,
        body.description_en,
        body.description_zh,
        body.property_type,
        body.deal_type,
        Number(body.price_idr),
        Number(body.area_sqm),
        body.city,
        body.district || "",
        body.address || "",
        body.visibility || "draft",
        body.availability || "open",
        body.source_name || "",
        body.internal_note || "",
      ]
    );
    const listingId = result.insertId;
    await syncAmenities(conn, listingId, body.amenity_ids);
    await conn.commit();

    const [rows] = await pool.query("SELECT * FROM listings WHERE id = ?", [
      listingId,
    ]);
    res
      .status(201)
      .json({ listing: await hydrateListing(rows[0], { includeInternal: true }) });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to create listing" });
  } finally {
    conn.release();
  }
});

adminListingsRouter.put("/:id", async (req, res) => {
  const body = req.body || {};
  const errors = validateListingBody(body, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });

  const [existing] = await pool.query("SELECT * FROM listings WHERE id = ?", [
    req.params.id,
  ]);
  if (!existing[0]) return res.status(404).json({ error: "Listing not found" });

  const current = existing[0];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE listings SET
        title_en = ?, title_zh = ?, description_en = ?, description_zh = ?,
        property_type = ?, deal_type = ?, price_idr = ?, area_sqm = ?,
        city = ?, district = ?, address = ?, visibility = ?, availability = ?,
        source_name = ?, internal_note = ?
       WHERE id = ?`,
      [
        body.title_en ?? current.title_en,
        body.title_zh ?? current.title_zh,
        body.description_en ?? current.description_en,
        body.description_zh ?? current.description_zh,
        body.property_type ?? current.property_type,
        body.deal_type ?? current.deal_type,
        Number(body.price_idr ?? current.price_idr),
        Number(body.area_sqm ?? current.area_sqm),
        body.city ?? current.city,
        body.district ?? current.district,
        body.address ?? current.address,
        body.visibility ?? current.visibility,
        body.availability ?? current.availability,
        body.source_name ?? current.source_name ?? "",
        body.internal_note ?? current.internal_note ?? "",
        req.params.id,
      ]
    );

    if (body.amenity_ids !== undefined) {
      await syncAmenities(conn, Number(req.params.id), body.amenity_ids);
    }

    await conn.commit();
    const [rows] = await pool.query("SELECT * FROM listings WHERE id = ?", [
      req.params.id,
    ]);
    res.json({
      listing: await hydrateListing(rows[0], { includeInternal: true }),
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to update listing" });
  } finally {
    conn.release();
  }
});

adminListingsRouter.delete("/:id", async (req, res) => {
  try {
    const images = await getImages(req.params.id);
    const [result] = await pool.query("DELETE FROM listings WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }
    for (const img of images) {
      const filePath = path.join(uploadsRoot, img.path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

adminListingsRouter.post(
  "/:id/images",
  upload.array("images", 12),
  async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT id FROM listings WHERE id = ?", [
        req.params.id,
      ]);
      if (!rows[0]) return res.status(404).json({ error: "Listing not found" });

      const [maxRows] = await pool.query(
        "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM listing_images WHERE listing_id = ?",
        [req.params.id]
      );
      let sort = Number(maxRows[0].max_order) + 1;

      for (const file of req.files || []) {
        await pool.query(
          "INSERT INTO listing_images (listing_id, path, sort_order) VALUES (?, ?, ?)",
          [req.params.id, file.filename, sort++]
        );
      }

      res.status(201).json({ images: await getImages(req.params.id) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to upload images" });
    }
  }
);

adminListingsRouter.delete("/:id/images/:imageId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM listing_images WHERE id = ? AND listing_id = ?",
      [req.params.imageId, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Image not found" });

    await pool.query("DELETE FROM listing_images WHERE id = ?", [
      req.params.imageId,
    ]);
    const filePath = path.join(uploadsRoot, rows[0].path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ images: await getImages(req.params.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

adminListingsRouter.put("/:id/images/reorder", async (req, res) => {
  try {
    const order = req.body?.order;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: "order array required" });
    }
    for (let i = 0; i < order.length; i++) {
      await pool.query(
        "UPDATE listing_images SET sort_order = ? WHERE id = ? AND listing_id = ?",
        [i, order[i], req.params.id]
      );
    }
    res.json({ images: await getImages(req.params.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reorder images" });
  }
});

export default router;
