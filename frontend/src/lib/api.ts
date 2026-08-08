const TARGETS = {
  local: "http://localhost:4000",
  deployed: "https://property-listing-api.72-60-78-140.sslip.io",
} as const;

type ApiTarget = keyof typeof TARGETS;

function resolveApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  const target = (process.env.NEXT_PUBLIC_API_TARGET || "local") as ApiTarget;
  return TARGETS[target] || TARGETS.local;
}

const API_BASE = resolveApiBase();

export type Amenity = {
  id: number;
  key: string;
  label_en: string;
  label_zh: string;
  icon: string;
};

export type ListingImage = {
  id: number;
  path: string;
  url: string;
  sort_order: number;
};

export type Listing = {
  id: number;
  title_en: string;
  title_zh: string;
  description_en: string;
  description_zh: string;
  property_type: "factory" | "warehouse";
  deal_type: "rent" | "sell";
  price_idr: number;
  area_sqm: number;
  city: string;
  district: string;
  address: string;
  visibility: "draft" | "published";
  availability: "open" | "closed";
  images: ListingImage[];
  amenities: Amenity[];
};

export type ContactSettings = {
  contact_name: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  brand_name_en: string;
  brand_name_zh: string;
};

export function mediaUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return `${API_BASE}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchListings(params: Record<string, string | undefined> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const q = qs.toString();
  return getJson<{ listings: Listing[]; total: number }>(
    `/api/listings${q ? `?${q}` : ""}`,
  );
}

export async function fetchListing(id: string | number) {
  return getJson<{ listing: Listing }>(`/api/listings/${id}`);
}

export async function fetchCities() {
  return getJson<{ cities: string[] }>("/api/listings/cities");
}

export async function fetchContact() {
  return getJson<ContactSettings>("/api/settings/contact");
}
