"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ListingDetailClient } from "@/components/ListingDetailClient";
import {
  fetchContact,
  fetchListing,
  type ContactSettings,
  type Listing,
} from "@/lib/api";

function listingIdFromLocation(
  pathname: string | null,
  paramId: string | string[] | undefined,
) {
  const parts = (pathname || "").split("/").filter(Boolean);
  // /en/listings/6 → ["en","listings","6"]
  const listingsIdx = parts.indexOf("listings");
  if (listingsIdx >= 0 && parts[listingsIdx + 1]) {
    const fromPath = parts[listingsIdx + 1];
    if (fromPath && fromPath !== "_") return fromPath;
  }
  const fromParams = Array.isArray(paramId) ? paramId[0] : paramId;
  if (fromParams && fromParams !== "_") return fromParams;
  return null;
}

export function ListingDetailLoader() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const id = listingIdFromLocation(pathname, params?.id);

  const [listing, setListing] = useState<Listing | null>(null);
  const [contact, setContact] = useState<ContactSettings | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([
      fetchListing(id),
      fetchContact().catch(() => null),
    ])
      .then(([listingRes, contactRes]) => {
        if (cancelled) return;
        setListing(listingRes.listing);
        setContact(contactRes);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-muted">
        …
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 text-center">
        <p className="text-lg font-semibold text-foreground">404</p>
        <p className="text-muted">{t("noResults")}</p>
        <a
          href={`/${locale}/`}
          className="text-sm font-semibold text-brand underline"
        >
          {t("back")}
        </a>
      </div>
    );
  }

  return <ListingDetailClient listing={listing} contact={contact} />;
}
