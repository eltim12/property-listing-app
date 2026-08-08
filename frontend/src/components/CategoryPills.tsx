"use client";

import {
  Factory,
  Globe2,
  KeyRound,
  Tag,
  Warehouse,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

const categories = [
  { id: "all", href: "/search", icon: Globe2 },
  {
    id: "factory",
    href: "/search?property_type=factory",
    icon: Factory,
  },
  {
    id: "warehouse",
    href: "/search?property_type=warehouse",
    icon: Warehouse,
  },
  {
    id: "rent",
    href: "/search?deal_type=rent",
    icon: KeyRound,
  },
  {
    id: "sell",
    href: "/search?deal_type=sell",
    icon: Tag,
  },
] as const;

export function CategoryPills() {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const propertyType = searchParams.get("property_type") || "";
  const dealType = searchParams.get("deal_type") || "";
  const onSearch = pathname.includes("/search");

  const labels: Record<string, string> = {
    all: t("all"),
    factory: t("factory"),
    warehouse: t("warehouse"),
    rent: t("rent"),
    sell: t("sell"),
  };

  function isActive(id: string) {
    if (id === "all") {
      return onSearch && !propertyType && !dealType;
    }
    if (id === "factory") return propertyType === "factory" && !dealType;
    if (id === "warehouse") return propertyType === "warehouse" && !dealType;
    if (id === "rent") return dealType === "rent" && !propertyType;
    if (id === "sell") return dealType === "sell" && !propertyType;
    return false;
  }

  return (
    <div className="scrollbar-hide -mx-4 flex gap-2.5 overflow-x-auto px-4 py-1 md:-mx-0 md:px-0">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const active = isActive(cat.id);
        return (
          <Link
            key={cat.id}
            href={cat.href}
            className={`neo-chip ${active ? "neo-chip-active" : ""}`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span>{labels[cat.id]}</span>
          </Link>
        );
      })}
    </div>
  );
}
