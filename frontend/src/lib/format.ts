import type { Listing } from "./api";

export function formatIdr(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export function isVideo(pathOrUrl?: string | null) {
  if (!pathOrUrl) return false;
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(pathOrUrl);
}

export function listingTitle(listing: Listing, locale: string) {
  return locale === "zh" ? listing.title_zh : listing.title_en;
}

export function listingDescription(listing: Listing, locale: string) {
  return locale === "zh" ? listing.description_zh : listing.description_en;
}

export function amenityLabel(
  amenity: { label_en: string; label_zh: string },
  locale: string,
) {
  return locale === "zh" ? amenity.label_zh : amenity.label_en;
}

export function availabilityLabel(
  listing: Listing,
  locale: string,
  t: (key: string) => string,
) {
  if (listing.availability === "closed") {
    return listing.deal_type === "sell" ? t("sold") : t("rented");
  }
  return listing.deal_type === "sell" ? t("openSale") : t("openRent");
}
