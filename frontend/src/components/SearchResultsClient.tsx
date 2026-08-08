"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import { SiteHeader } from "@/components/SiteHeaderClient";
import { Link } from "@/i18n/navigation";
import {
  fetchCities,
  fetchContact,
  fetchListings,
  type ContactSettings,
  type Listing,
} from "@/lib/api";

export function SearchResultsClient() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const city = searchParams.get("city") || undefined;
  const property_type = searchParams.get("property_type") || undefined;
  const deal_type = searchParams.get("deal_type") || undefined;
  const availability = searchParams.get("availability") || undefined;
  const q = searchParams.get("q") || undefined;

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState<string[]>([]);
  const [contact, setContact] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchListings({
        city,
        property_type,
        deal_type,
        availability,
        q,
        limit: "24",
      }).catch(() => ({ listings: [] as Listing[], total: 0 })),
      fetchCities().catch(() => ({ cities: [] as string[] })),
      fetchContact().catch(() => null),
    ]).then(([listingsRes, citiesRes, contactRes]) => {
      if (cancelled) return;
      setListings(listingsRes.listings || []);
      setTotal(listingsRes.total || 0);
      setCities(citiesRes.cities || []);
      setContact(contactRes);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [city, property_type, deal_type, availability, q]);

  const filterHref = (nextAvailability?: string) => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (property_type) params.set("property_type", property_type);
    if (deal_type) params.set("deal_type", deal_type);
    if (nextAvailability) params.set("availability", nextAvailability);
    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  };

  return (
    <>
      <SiteHeader
        cities={cities}
        contact={contact}
        initialSearch={{ city, property_type, deal_type }}
      />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 md:flex-row md:gap-8 md:px-6 md:py-8">
        <aside className="w-full shrink-0 md:w-56">
          <h2 className="mb-3 text-lg font-semibold">{t("filters")}</h2>
          <div className="scrollbar-hide -mx-4 flex gap-2.5 overflow-x-auto px-4 py-1 md:mx-0 md:flex-col md:overflow-visible md:px-0">
            {(
              [
                {
                  href: filterHref(),
                  label: t("all"),
                  active: !availability,
                },
                {
                  href: filterHref("open"),
                  label: t("openOnly"),
                  active: availability === "open",
                },
                {
                  href: filterHref("closed"),
                  label: t("closedOnly"),
                  active: availability === "closed",
                },
              ] as const
            ).map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`neo-chip ${item.active ? "neo-chip-active" : ""} md:w-full md:justify-center`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <h1 className="mb-1 text-xl font-semibold md:text-2xl">
            {t("listings")}
          </h1>
          <p className="mb-5 text-sm text-muted">
            {loading ? "…" : t("results", { count: total })}
          </p>

          {loading ? (
            <p className="py-16 text-center text-muted">…</p>
          ) : listings.length === 0 ? (
            <p className="py-16 text-center text-muted">{t("noResults")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
