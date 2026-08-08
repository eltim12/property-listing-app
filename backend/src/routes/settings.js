import { Router } from "express";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function mapSettings(row) {
  return {
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    contact_whatsapp: row.contact_whatsapp,
    contact_email: row.contact_email,
    brand_name_en: row.brand_name_en,
    brand_name_zh: row.brand_name_zh,
  };
}

router.get("/contact", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM settings WHERE id = 1");
    if (!rows[0]) {
      return res.json({
        contact_name: "",
        contact_phone: "",
        contact_whatsapp: "",
        contact_email: "",
        brand_name_en: "Property Listings",
        brand_name_zh: "厂房仓库",
      });
    }
    res.json(mapSettings(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

router.get("/admin", requireAuth, async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM settings WHERE id = 1");
    res.json(mapSettings(rows[0] || {}));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

router.put("/admin", requireAuth, async (req, res) => {
  try {
    const {
      contact_name = "",
      contact_phone = "",
      contact_whatsapp = "",
      contact_email = "",
      brand_name_en = "Property Listings",
      brand_name_zh = "厂房仓库",
    } = req.body || {};

    await pool.query(
      `INSERT INTO settings (id, contact_name, contact_phone, contact_whatsapp, contact_email, brand_name_en, brand_name_zh)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         contact_name = VALUES(contact_name),
         contact_phone = VALUES(contact_phone),
         contact_whatsapp = VALUES(contact_whatsapp),
         contact_email = VALUES(contact_email),
         brand_name_en = VALUES(brand_name_en),
         brand_name_zh = VALUES(brand_name_zh)`,
      [
        contact_name,
        contact_phone,
        contact_whatsapp,
        contact_email,
        brand_name_en,
        brand_name_zh,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM settings WHERE id = 1");
    res.json(mapSettings(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
