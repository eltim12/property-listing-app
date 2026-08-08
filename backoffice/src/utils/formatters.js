export function formatIdr(value) {
  const n = Number(value) || 0;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const apiOrigin = (
  import.meta.env.VITE_API_ORIGIN || "http://localhost:4000"
).replace(/\/$/, "");

export function mediaUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http") || pathOrUrl.startsWith("blob:")) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/uploads/${pathOrUrl.replace(/^\/+/, "")}`;
  // Always use absolute API origin so local/deployed switch works for images too
  return `${apiOrigin}${path}`;
}

