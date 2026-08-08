"use client";

import { Building2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ContactSettings } from "@/lib/api";
import { BottomNav } from "./BottomNav";
import { CategoryPills } from "./CategoryPills";
import { LangToggle } from "./LangToggle";
import { SearchBar } from "./SearchBar";

type Props = {
  cities?: string[];
  contact?: ContactSettings | null;
  showSearch?: boolean;
  showCategories?: boolean;
  initialSearch?: {
    city?: string;
    property_type?: string;
    deal_type?: string;
  };
};

export function SiteHeader({
  cities = [],
  contact = null,
  showSearch = true,
  showCategories = true,
  initialSearch = {},
}: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const brand =
    locale === "zh"
      ? contact?.brand_name_zh || t("brand")
      : contact?.brand_name_en || t("brand");

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)]/95 backdrop-blur-md md:hidden">
        <div className="space-y-3 px-4 pt-3 pb-2">
          {showSearch && (
            <SearchBar cities={cities} initial={initialSearch} variant="pill" />
          )}
          {showCategories && <CategoryPills />}
        </div>
      </header>

      <header className="sticky top-0 z-40 hidden border-b border-border/60 bg-[var(--background)]/90 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-brand">
              {brand}
            </span>
          </Link>

          {showSearch && (
            <div className="flex flex-1 justify-center">
              <SearchBar cities={cities} initial={initialSearch} variant="bar" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <LangToggle />
          </div>
        </div>
        {showCategories && (
          <div className="mx-auto max-w-7xl px-6 pb-3">
            <CategoryPills />
          </div>
        )}
      </header>

      <BottomNav contact={contact} />
    </>
  );
}
