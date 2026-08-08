import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, `key`, label_en, label_zh, icon FROM amenities ORDER BY id ASC"
    );
    res.json({ amenities: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load amenities" });
  }
});

export default router;
