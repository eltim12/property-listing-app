import { setRequestLocale } from "next-intl/server";
import { ListingDetailLoader } from "@/components/ListingDetailLoader";
import { fetchListings } from "@/lib/api";
import { routing } from "@/i18n/routing";

/** `_` is the Firebase Hosting catch-all shell for new listing IDs. */
export async function generateStaticParams() {
  const ids = new Set<string>(["_"]);
  try {
    const data = await fetchListings({ limit: "100" });
    for (const listing of data.listings || []) {
      ids.add(String(listing.id));
    }
  } catch {
    /* API unavailable at build time — shell page is enough */
  }

  return routing.locales.flatMap((locale) =>
    [...ids].map((id) => ({ locale, id })),
  );
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ListingDetailLoader />;
}
