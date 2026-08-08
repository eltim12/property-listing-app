"use client";

import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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

export function HomePageClient() {
  const t = useTranslations();
  const locale = useLocale();
  const [all, setAll] = useState<Listing[]>([]);
  const [factories, setFactories] = useState<Listing[]>([]);
  const [warehouses, setWarehouses] = useState<Listing[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [contact, setContact] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchListings({ limit: "8" }).catch(() => ({ listings: [] as Listing[] })),
      fetchListings({ property_type: "factory", limit: "6" }).catch(() => ({
        listings: [] as Listing[],
      })),
      fetchListings({ property_type: "warehouse", limit: "6" }).catch(() => ({
        listings: [] as Listing[],
      })),
      fetchCities().catch(() => ({ cities: [] as string[] })),
      fetchContact().catch(() => null),
    ]).then(([allRes, factoryRes, warehouseRes, citiesRes, contactRes]) => {
      if (cancelled) return;
      setAll(allRes.listings || []);
      setFactories(factoryRes.listings || []);
      setWarehouses(warehouseRes.listings || []);
      setCities(citiesRes.cities || []);
      setContact(contactRes);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const brand =
    locale === "zh"
      ? contact?.brand_name_zh || t("brand")
      : contact?.brand_name_en || t("brand");

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <SiteHeader cities={cities} contact={contact} />

      <section className="relative hidden overflow-hidden border-b border-border bg-[radial-gradient(ellipse_at_top,_#eff6ff_0%,_#ffffff_55%)] md:block">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="mb-3 text-sm font-semibold tracking-wide text-brand">
            {brand}
          </p>
          <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-foreground">
            {t("tagline")}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{t("homesSubtitle")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-0 py-5 md:space-y-12 md:px-6 md:py-10">
        <ListingSection
          title={t("popularNear", { city: "Indonesia" })}
          href="/search"
          seeAll={t("seeAll")}
          listings={all}
          empty={loading ? "…" : t("noResults")}
        />

        {(loading || factories.length > 0) && (
          <ListingSection
            title={t("popularFactories")}
            href="/search?property_type=factory"
            seeAll={t("seeAll")}
            listings={factories}
            empty={loading ? "…" : t("noResults")}
            hideWhenEmpty={!loading}
          />
        )}

        {(loading || warehouses.length > 0) && (
          <ListingSection
            title={t("popularWarehouses")}
            href="/search?property_type=warehouse"
            seeAll={t("seeAll")}
            listings={warehouses}
            empty={loading ? "…" : t("noResults")}
            hideWhenEmpty={!loading}
          />
        )}
      </div>

      <footer className="mt-4 hidden border-t border-border py-10 text-center text-sm text-muted md:block">
        {t("footer")}
        {contact?.contact_name ? ` · ${contact.contact_name}` : ""}
      </footer>
    </div>
  );
}

function ListingSection({
  title,
  href,
  seeAll,
  listings,
  empty,
  hideWhenEmpty,
}: {
  title: string;
  href: string;
  seeAll: string;
  listings: Listing[];
  empty: string;
  hideWhenEmpty?: boolean;
}) {
  if (hideWhenEmpty && listings.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between px-4 md:px-0">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </h2>
        <Link href={href} className="neo-icon-btn" aria-label={seeAll}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="px-4 py-10 text-center text-muted md:px-0">{empty}</p>
      ) : (
        <>
          <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:hidden">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} carousel />
            ))}
          </div>
          <div className="hidden grid-cols-2 gap-x-6 gap-y-10 md:grid lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
