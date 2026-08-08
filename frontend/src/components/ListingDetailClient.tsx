"use client";

import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { ContactSettings, Listing } from "@/lib/api";
import { mediaUrl } from "@/lib/api";
import {
  amenityLabel,
  availabilityLabel,
  formatIdr,
  isVideo,
  listingDescription,
  listingTitle,
} from "@/lib/format";
import { AmenityIcon } from "./AmenityIcon";
import { MediaLightbox } from "./MediaLightbox";
import { useRouter } from "@/i18n/navigation";
import { MapPin, Ruler } from "lucide-react";

type Props = {
  listing: Listing;
  contact: ContactSettings | null;
};

export function ListingDetailClient({ listing, contact }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const images = listing.images?.length ? listing.images : [];
  const [index, setIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  function onTrackScroll() {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  }

  function openPreview(i: number) {
    setPreviewIndex(i);
    setPreviewOpen(true);
  }

  const title = listingTitle(listing, locale);
  const description = listingDescription(listing, locale);
  const status = availabilityLabel(listing, locale, t);
  const closed = listing.availability === "closed";
  const phone = contact?.contact_phone || "";
  const wa = (contact?.contact_whatsapp || phone).replace(/[^\d]/g, "");
  const typeLabel =
    listing.property_type === "factory" ? t("factory") : t("warehouse");

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* cancelled */
      }
    } else if (url) {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-28 md:pb-10">
      {/* Mobile gallery hero */}
      <div className="relative md:hidden">
        <div className="relative aspect-[4/3] bg-surface">
          {images.length > 0 ? (
            <div
              ref={trackRef}
              onScroll={onTrackScroll}
              className="scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto"
            >
              {images.map((m, i) => {
                const url = mediaUrl(m.url);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => openPreview(i)}
                    className="relative h-full w-full shrink-0 snap-center cursor-zoom-in overflow-hidden"
                    aria-label={`${title} ${i + 1}`}
                  >
                    {isVideo(m.url) ? (
                      <video
                        src={url}
                        muted
                        playsInline
                        preload="metadata"
                        className={`pointer-events-none h-full w-full bg-black object-cover ${closed ? "brightness-75" : ""}`}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={title}
                        draggable={false}
                        className={`h-full w-full object-cover ${closed ? "brightness-75" : ""}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              {typeLabel}
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => router.back()}
              className="neo-icon-btn pointer-events-auto"
              aria-label={t("back")}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={share}
              className="neo-icon-btn pointer-events-auto"
              aria-label={t("share")}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {images.length > 1 && (
            <>
              <span className="absolute right-4 bottom-8 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white">
                {index + 1} / {images.length}
              </span>
              <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-1.5">
                {images.map((m, i) => (
                  <span
                    key={m.id}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative z-10 -mt-6 rounded-t-3xl bg-white px-5 pt-6 shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
          <DetailBody
            listing={listing}
            title={title}
            description={description}
            status={status}
            closed={closed}
            typeLabel={typeLabel}
            locale={locale}
            t={t}
            contact={contact}
          />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="mx-auto hidden max-w-6xl px-6 py-6 md:block">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </button>

        <h1 className="mb-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <StatusPill closed={closed} status={status} />
          <span className="text-muted">
            {listing.city}
            {listing.district ? ` · ${listing.district}` : ""}
          </span>
        </div>

        <div className="mb-10 grid h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl">
          <button
            type="button"
            onClick={() => images[0] && openPreview(0)}
            className="relative col-span-2 row-span-2 cursor-zoom-in overflow-hidden"
            disabled={!images[0]}
          >
            {images[0] ? (
              isVideo(images[0].url) ? (
                <video
                  src={mediaUrl(images[0].url)}
                  muted
                  playsInline
                  preload="metadata"
                  className={`pointer-events-none h-full w-full bg-black object-cover ${closed ? "brightness-75" : ""}`}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(images[0].url)}
                  alt={title}
                  className={`h-full w-full object-cover ${closed ? "brightness-75" : ""}`}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center bg-surface">
                {typeLabel}
              </div>
            )}
          </button>
          {[1, 2, 3, 4].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => images[i] && openPreview(i)}
              disabled={!images[i]}
              className="relative cursor-zoom-in overflow-hidden bg-surface disabled:cursor-default"
            >
              {images[i] ? (
                isVideo(images[i].url) ? (
                  <video
                    src={mediaUrl(images[i].url)}
                    muted
                    playsInline
                    preload="metadata"
                    className={`pointer-events-none h-full w-full bg-black object-cover ${closed ? "brightness-75" : ""}`}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(images[i].url)}
                    alt=""
                    className={`h-full w-full object-cover ${closed ? "brightness-75" : ""}`}
                  />
                )
              ) : null}
            </button>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <DetailBody
            listing={listing}
            title={title}
            description={description}
            status={status}
            closed={closed}
            typeLabel={typeLabel}
            locale={locale}
            t={t}
            contact={contact}
            hideTitle
          />
          <aside>
            <div className="sticky top-28 rounded-2xl border border-border p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
              <div className="mb-1">
                <span className="text-2xl font-semibold">
                  {formatIdr(listing.price_idr)}
                </span>
                {listing.deal_type === "rent" && (
                  <span className="text-muted">{t("perMonth")}</span>
                )}
              </div>
              <p className="mb-5 text-sm text-muted">{status}</p>
              {!closed && contact && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    {t("contact")}: {contact.contact_name}
                  </p>
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex h-12 items-center justify-center gap-2 rounded-lg border border-border font-semibold"
                    >
                      <Phone className="h-4 w-4" />
                      {t("call")}
                    </a>
                  )}
                  {wa && (
                    <a
                      href={`https://wa.me/${wa}?text=${encodeURIComponent(title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] font-semibold text-white hover:bg-[var(--brand-dark)]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {t("whatsapp")}
                    </a>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div
              className={`font-semibold ${closed ? "text-muted line-through" : ""}`}
            >
              {formatIdr(listing.price_idr)}
              {listing.deal_type === "rent" ? (
                <span className="font-normal text-muted">{t("perMonth")}</span>
              ) : null}
            </div>
            <div className="truncate text-xs text-muted">
              {closed ? status : contact?.contact_name || status}
            </div>
          </div>
          {!closed && wa ? (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] px-6 text-base font-semibold text-white"
            >
              {t("contactCta")}
            </a>
          ) : !closed && phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] px-6 text-base font-semibold text-white"
            >
              {t("call")}
            </a>
          ) : (
            <span className="inline-flex h-12 shrink-0 items-center rounded-lg bg-neutral-200 px-6 text-base font-semibold text-muted">
              {status}
            </span>
          )}
        </div>
      </div>

      <MediaLightbox
        media={images}
        startIndex={previewIndex}
        alt={title}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        closeLabel={t("close")}
      />
    </div>
  );
}

function StatusPill({ closed, status }: { closed: boolean; status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        closed ? "bg-neutral-900 text-white" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {status}
    </span>
  );
}

function DetailBody({
  listing,
  title,
  description,
  status,
  closed,
  typeLabel,
  locale,
  t,
  contact,
  hideTitle,
}: {
  listing: Listing;
  title: string;
  description: string;
  status: string;
  closed: boolean;
  typeLabel: string;
  locale: string;
  t: (key: string) => string;
  contact: ContactSettings | null;
  hideTitle?: boolean;
}) {
  return (
    <div className="space-y-8">
      {!hideTitle && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {typeLabel} {t("in")} {listing.city}
            {listing.district ? `, ${listing.district}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted">
            {Math.round(listing.area_sqm).toLocaleString("id-ID")} m² ·{" "}
            {listing.deal_type === "rent" ? t("rent") : t("sell")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border py-4 text-center">
        <div>
          <div className="text-lg font-semibold">
            {Math.round(listing.area_sqm).toLocaleString("id-ID")}
          </div>
          <div className="text-xs text-muted">m²</div>
        </div>
        <div>
          <div className="px-2 text-sm font-semibold leading-tight">
            {status}
          </div>
          <div className="text-xs text-muted">{t("availability")}</div>
        </div>
        <div>
          <div className="text-sm font-semibold">{typeLabel}</div>
          <div className="text-xs text-muted">
            {listing.deal_type === "rent" ? t("rent") : t("sell")}
          </div>
        </div>
      </div>

      {contact && (
        <div className="flex items-center gap-4 border-b border-border pb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-lg font-semibold text-white">
            {contact.contact_name?.charAt(0) || "?"}
          </div>
          <div>
            <div className="font-semibold">
              {t("hostedBy")} {contact.contact_name}
            </div>
            <div className="text-sm text-muted">{t("contactPerson")}</div>
          </div>
        </div>
      )}

      {closed && (
        <div className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">
          {t("closedNotice")}
        </div>
      )}

      <section className="flex flex-wrap gap-6 border-b border-border pb-8">
        <div className="flex items-center gap-3">
          <Ruler className="h-6 w-6" />
          <div>
            <div className="font-medium">
              {Math.round(listing.area_sqm).toLocaleString("id-ID")} m²
            </div>
            <div className="text-sm text-muted">{t("area")}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6" />
          <div>
            <div className="font-medium">{listing.city}</div>
            <div className="text-sm text-muted">{listing.district || typeLabel}</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">{t("about")}</h2>
        <p className="whitespace-pre-line leading-relaxed text-foreground/90">
          {description}
        </p>
      </section>

      {listing.amenities?.length > 0 && (
        <section>
          <h2 className="mb-5 text-xl font-semibold">{t("amenities")}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {listing.amenities.map((a) => (
              <div key={a.id} className="flex items-start gap-4">
                <AmenityIcon name={a.icon} className="mt-0.5 h-6 w-6" />
                <div>
                  <div className="font-medium">{amenityLabel(a, locale)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="pb-4">
        <h2 className="mb-3 text-xl font-semibold">{t("locationSection")}</h2>
        <p className="text-foreground/90">
          {[listing.address, listing.district, listing.city]
            .filter(Boolean)
            .join(", ")}
        </p>
      </section>
    </div>
  );
}
