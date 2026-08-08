import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};

const dbName = process.env.DB_NAME || "property_listing";

const amenities = [
  { key: "parking", label_en: "Parking", label_zh: "停车位", icon: "ParkingCircle" },
  { key: "power", label_en: "Industrial power", label_zh: "工业用电", icon: "Zap" },
  { key: "loading_dock", label_en: "Loading dock", label_zh: "装卸码头", icon: "Truck" },
  { key: "security", label_en: "24h security", label_zh: "24小时安保", icon: "Shield" },
  { key: "wifi", label_en: "Internet ready", label_zh: "网络就绪", icon: "Wifi" },
  { key: "crane", label_en: "Overhead crane", label_zh: "行车/吊机", icon: "//lift" },
  { key: "office", label_en: "Office space", label_zh: "办公区", icon: "Building2" },
  { key: "fire_system", label_en: "Fire system", label_zh: "消防系统", icon: "Flame" },
];

// Fix typo - Forklift not //lift
amenities[5].icon = "Forklift";

async function main() {
  const root = await mysql.createConnection(config);
  await root.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await root.end();

  const conn = await mysql.createConnection({ ...config, database: dbName, multipleStatements: true });

  const schemaSql = await import("fs").then((fs) =>
    fs.readFileSync(new URL("../sql/schema.sql", import.meta.url), "utf8")
  );
  // schema has CREATE DATABASE + USE — strip those since we're already connected
  const cleaned = schemaSql
    .replace(/CREATE DATABASE[\s\S]*?;/i, "")
    .replace(/USE\s+\w+\s*;/i, "");
  await conn.query(cleaned);

  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Admin";
  const hash = await bcrypt.hash(password, 10);

  await conn.query(
    `INSERT INTO admins (email, password_hash, name)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name)`,
    [email, hash, name]
  );

  await conn.query(
    `INSERT INTO settings (id, contact_name, contact_phone, contact_whatsapp, contact_email, brand_name_en, brand_name_zh)
     VALUES (1, 'Budi Santoso', '+6281234567890', '6281234567890', 'budi@example.com', 'GudangKu', '工厂仓')
     ON DUPLICATE KEY UPDATE contact_name = VALUES(contact_name)`
  );

  for (const a of amenities) {
    await conn.query(
      `INSERT INTO amenities (\`key\`, label_en, label_zh, icon)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE label_en = VALUES(label_en), label_zh = VALUES(label_zh), icon = VALUES(icon)`,
      [a.key, a.label_en, a.label_zh, a.icon]
    );
  }

  const [existing] = await conn.query("SELECT COUNT(*) AS c FROM listings");
  if (existing[0].c === 0) {
    const [amenityRows] = await conn.query("SELECT id FROM amenities");
    const amenityIds = amenityRows.map((r) => r.id);

    const samples = [
      {
        title_en: "Modern warehouse in Cikarang",
        title_zh: "西卡朗现代化仓库",
        description_en:
          "Spacious warehouse with high ceiling, loading docks, and excellent highway access. Ideal for logistics and distribution.",
        description_zh:
          "高挑空现代化仓库，配备装卸码头，临近高速，适合物流与分销业务。",
        property_type: "warehouse",
        deal_type: "rent",
        price_idr: 85000000,
        area_sqm: 2500,
        city: "Bekasi",
        district: "Cikarang",
        address: "Kawasan Industri Jababeka, Cikarang",
        visibility: "published",
        availability: "open",
      },
      {
        title_en: "Factory ready for production — Tangerang",
        title_zh: "丹格朗即用厂房",
        description_en:
          "Factory building with industrial power, office annex, and secured compound. Suitable for light manufacturing.",
        description_zh:
          "配备工业用电与办公附楼的厂房，封闭园区，适合轻工业生产。",
        property_type: "factory",
        deal_type: "sell",
        price_idr: 12500000000,
        area_sqm: 3200,
        city: "Tangerang",
        district: "Cikupa",
        address: "Jl. Industri Raya No. 18, Cikupa",
        visibility: "published",
        availability: "open",
      },
      {
        title_en: "Compact warehouse near Jakarta port",
        title_zh: "靠近雅加达港口的紧凑仓库",
        description_en:
          "Recently rented — compact warehouse with container access, close to Tanjung Priok logistics corridor.",
        description_zh: "已出租 — 紧凑型仓库，可进出集装箱，靠近丹戎不碌物流走廊。",
        property_type: "warehouse",
        deal_type: "rent",
        price_idr: 45000000,
        area_sqm: 800,
        city: "Jakarta",
        district: "Tanjung Priok",
        address: "Jl. Yos Sudarso, Tanjung Priok",
        visibility: "published",
        availability: "closed",
      },
    ];

    for (const s of samples) {
      const [result] = await conn.query(
        `INSERT INTO listings (
          title_en, title_zh, description_en, description_zh,
          property_type, deal_type, price_idr, area_sqm,
          city, district, address, visibility, availability
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.title_en,
          s.title_zh,
          s.description_en,
          s.description_zh,
          s.property_type,
          s.deal_type,
          s.price_idr,
          s.area_sqm,
          s.city,
          s.district,
          s.address,
          s.visibility,
          s.availability,
        ]
      );
      for (const aid of amenityIds.slice(0, 5)) {
        await conn.query(
          "INSERT INTO listing_amenities (listing_id, amenity_id) VALUES (?, ?)",
          [result.insertId, aid]
        );
      }
    }
  }

  await conn.end();
  console.log("Seed complete.");
  console.log(`Admin: ${email} / ${password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
