import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import amenitiesRoutes from "./routes/amenities.js";
import settingsRoutes from "./routes/settings.js";
import listingsRoutes, { adminListingsRouter } from "./routes/listings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 4000);

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  process.env.BACKOFFICE_ORIGIN || "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://industrialbridge-d9312.web.app",
  "https://industrialbridge-d9312.firebaseapp.com",
  "https://property-listing-api.72-60-78-140.sslip.io",
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/admin/listings", adminListingsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: err.message });
  }
  if (
    err instanceof multer.MulterError ||
    err.message === "Only images or videos are allowed"
  ) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
