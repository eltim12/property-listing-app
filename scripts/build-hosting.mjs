#!/usr/bin/env node
/**
 * Build frontend + backoffice into ./hosting for Firebase Hosting.
 * Frontend → /   Backoffice → /admin/
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hosting = path.join(root, "hosting");

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function rimraf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

// Point both apps at the deployed API
run("node scripts/set-api-target.mjs deployed");

run("npm run build", path.join(root, "frontend"));
run("npm run build", path.join(root, "backoffice"));

const frontendOut = path.join(root, "frontend", "out");
const backofficeDist = path.join(root, "backoffice", "dist");

if (!fs.existsSync(frontendOut)) {
  throw new Error("frontend/out missing — Next export failed");
}
if (!fs.existsSync(backofficeDist)) {
  throw new Error("backoffice/dist missing — Vite build failed");
}

rimraf(hosting);
copyDir(frontendOut, hosting);
copyDir(backofficeDist, path.join(hosting, "admin"));

// Ensure /admin resolves even without trailing slash rewrite edge cases
const adminIndex = path.join(hosting, "admin", "index.html");
if (!fs.existsSync(adminIndex)) {
  throw new Error("hosting/admin/index.html missing");
}

console.log("\nHosting bundle ready at ./hosting");
console.log("  Public site:  /");
console.log("  Backoffice:   /admin/");
