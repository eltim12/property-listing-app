import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { SearchResultsClient } from "@/components/SearchResultsClient";

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <Suspense fallback={<div className="py-16 text-center text-muted">…</div>}>
        <SearchResultsClient />
      </Suspense>
    </div>
  );
}
