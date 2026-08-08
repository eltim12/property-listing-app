import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { HomePageClient } from "@/components/HomePageClient";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <HomePageClient />
    </Suspense>
  );
}
