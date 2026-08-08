"use client";

import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type MouseEvent } from "react";
import type { Listing } from "@/lib/api";
import { mediaUrl } from "@/lib/api";
import { formatIdr, listingTitle, availabilityLabel } from "@/lib/format";

export function ListingCard({
  listing,
  carousel = false,
}: {
  listing: Listing;
  carousel?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const images = listing.images?.length
    ? listing.images
    : [{ id: 0, path: "", url: "", sort_order: 0 }];
  const [index, setIndex] = useState(0);
  const closed = listing.availability === "closed";
  const title = listingTitle(listing, locale);
  const status = availabilityLabel(listing, locale, t);
  const typeLabel =
    listing.property_type === "factory" ? t("factory") : t("warehouse");

  function prev(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  }
  function next(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  }

  const src = mediaUrl(images[index]?.url || images[index]?.path);
  // Full page navigation so Firebase can serve the catch-all shell for new listing IDs
  const href = `/${locale}/listings/${listing.id}/`;

  return (
    <a
      href={href}
      className={`group animate-fade-up block ${
        carousel
          ? "w-[85vw] max-w-[320px] shrink-0 snap-start"
          : "w-full"
      }`}
    >
      <div className="relative aspect-[20/19] overflow-hidden rounded-2xl bg-surface">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={title}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
              closed ? "brightness-75" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-muted">
            {typeLabel}
          </div>
        )}

        <span className="absolute top-3 left-3 neo-chip !h-8 !px-3 !text-xs !gap-1.5">
          {closed ? status : typeLabel}
        </span>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute top-1/2 left-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition group-hover:opacity-100"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition group-hover:opacity-100"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="mt-3 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[15px] font-semibold text-foreground">
            {typeLabel} {t("in")} {listing.city}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm text-foreground">
            <Star className="h-3.5 w-3.5 fill-foreground" />
            <span className="text-muted">
              {Math.round(listing.area_sqm).toLocaleString("id-ID")} m²
            </span>
          </span>
        </div>
        <p className="line-clamp-1 text-sm text-muted">{title}</p>
        <p className={`text-sm ${closed ? "text-muted line-through" : ""}`}>
          <span className="font-semibold text-foreground">
            {formatIdr(listing.price_idr)}
          </span>
          {listing.deal_type === "rent" ? (
            <span className="font-normal text-muted">{t("perMonth")}</span>
          ) : (
            <span className="font-normal text-muted"> · {t("sell")}</span>
          )}
        </p>
      </div>
    </a>
  );
}
