"use client";

import {
  Factory,
  Globe2,
  KeyRound,
  Search,
  Tag,
  Warehouse,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "@/i18n/navigation";
import { CustomSelect } from "./CustomSelect";

type Props = {
  cities?: string[];
  initial?: {
    city?: string;
    property_type?: string;
    deal_type?: string;
  };
  /** Compact trigger pill (mobile / header) */
  variant?: "pill" | "bar";
};

type SheetTab = "all" | "factory" | "warehouse";

export function SearchBar({
  cities = [],
  initial = {},
  variant = "bar",
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  const [city, setCity] = useState(initial.city || "");
  const [destinationQuery, setDestinationQuery] = useState(initial.city || "");
  const [propertyType, setPropertyType] = useState(initial.property_type || "");
  const [dealType, setDealType] = useState(initial.deal_type || "");
  const [sheetTab, setSheetTab] = useState<SheetTab>(
    initial.property_type === "factory" || initial.property_type === "warehouse"
      ? initial.property_type
      : "all",
  );

  useEffect(() => {
    setCity(initial.city || "");
    setDestinationQuery(initial.city || "");
    setPropertyType(initial.property_type || "");
    setDealType(initial.deal_type || "");
    setSheetTab(
      initial.property_type === "factory" ||
        initial.property_type === "warehouse"
        ? initial.property_type
        : "all",
    );
  }, [initial.city, initial.property_type, initial.deal_type]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const cityOptions = useMemo(
    () => [
      { value: "", label: t("anywhere") },
      ...cities.map((c) => ({ value: c, label: c })),
    ],
    [cities, t],
  );

  const typeOptions = useMemo(
    () => [
      { value: "", label: t("anyType") },
      { value: "factory", label: t("factory") },
      { value: "warehouse", label: t("warehouse") },
    ],
    [t],
  );

  const dealOptions = useMemo(
    () => [
      { value: "", label: t("anyDeal") },
      { value: "rent", label: t("rent") },
      { value: "sell", label: t("sell") },
    ],
    [t],
  );

  const filteredCities = useMemo(() => {
    const q = destinationQuery.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, destinationQuery]);

  const summary = useMemo(() => {
    const parts = [
      city || t("anywhere"),
      propertyType
        ? typeOptions.find((o) => o.value === propertyType)?.label
        : null,
      dealType ? dealOptions.find((o) => o.value === dealType)?.label : null,
    ].filter(Boolean);
    return parts.join(" · ");
  }, [city, propertyType, dealType, t, typeOptions, dealOptions]);

  function selectTab(tab: SheetTab) {
    setSheetTab(tab);
    setPropertyType(tab === "all" ? "" : tab);
  }

  function pickCity(value: string) {
    setCity(value);
    setDestinationQuery(value);
  }

  function apply() {
    const resolvedCity =
      city ||
      cities.find(
        (c) => c.toLowerCase() === destinationQuery.trim().toLowerCase(),
      ) ||
      "";

    const params = new URLSearchParams();
    if (resolvedCity) params.set("city", resolvedCity);
    else if (destinationQuery.trim()) params.set("q", destinationQuery.trim());
    if (propertyType) params.set("property_type", propertyType);
    if (dealType) params.set("deal_type", dealType);
    const q = params.toString();
    setSheetOpen(false);
    router.push(q ? `/search?${q}` : "/search");
  }

  function Fields() {
    return (
      <div className="flex w-full flex-col md:flex-row md:items-stretch">
        <div className="flex-1 border-b border-border px-5 py-3 md:border-r md:border-b-0">
          <CustomSelect
            label={t("location")}
            value={city}
            options={cityOptions}
            placeholder={t("anywhere")}
            onChange={setCity}
          />
        </div>
        <div className="flex-1 border-b border-border px-5 py-3 md:border-r md:border-b-0">
          <CustomSelect
            label={t("propertyType")}
            value={propertyType}
            options={typeOptions}
            placeholder={t("anyType")}
            onChange={setPropertyType}
          />
        </div>
        <div className="flex-1 px-5 py-3">
          <CustomSelect
            label={t("dealType")}
            value={dealType}
            options={dealOptions}
            placeholder={t("anyDeal")}
            onChange={setDealType}
          />
        </div>
      </div>
    );
  }

  const sheetTabs: {
    id: SheetTab;
    label: string;
    icon: typeof Factory;
  }[] = [
    { id: "all", label: t("all"), icon: Globe2 },
    { id: "factory", label: t("factory"), icon: Factory },
    { id: "warehouse", label: t("warehouse"), icon: Warehouse },
  ];

  if (variant === "pill") {
    return (
      <>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="neo-pill"
        >
          <Search className="h-5 w-5 shrink-0 text-foreground" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {t("startSearch")}
            </span>
            <span className="block truncate text-xs text-muted">{summary}</span>
          </span>
        </button>

        {sheetOpen &&
          mounted &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex flex-col bg-[#ebebeb]">
            {/* Top category tabs + close */}
            <div className="relative px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
              <div className="flex items-start justify-center gap-6 pt-3 pr-12">
                {sheetTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = sheetTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => selectTab(tab.id)}
                      className="flex min-w-[4.5rem] flex-col items-center gap-1.5 transition duration-180"
                    >
                      <Icon
                        className={`h-8 w-8 ${active ? "text-foreground" : "text-muted"}`}
                        strokeWidth={active ? 2.25 : 1.75}
                      />
                      <span
                        className={`text-sm ${
                          active
                            ? "font-semibold text-foreground"
                            : "font-medium text-muted"
                        }`}
                      >
                        {tab.label}
                      </span>
                      <span
                        className={`mt-0.5 h-0.5 w-full rounded-full transition ${
                          active ? "bg-foreground" : "bg-transparent"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="neo-icon-btn absolute top-[max(0.75rem,env(safe-area-inset-top))] right-4"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Bottom sheet card */}
            <div className="mt-2 flex min-h-0 flex-1 flex-col rounded-t-[32px] bg-white px-5 pt-6 shadow-[0_-8px_28px_rgba(0,0,0,0.08)]">
              <div className="min-h-0 flex-1 overflow-y-auto pb-28">
                <h2 className="mb-4 text-[1.65rem] font-semibold tracking-tight text-foreground">
                  {t("where")}
                </h2>

                <label className="flex h-14 items-center gap-3 rounded-2xl border border-[#dddddd] bg-white px-4">
                  <Search className="h-5 w-5 shrink-0 text-foreground" />
                  <input
                    type="text"
                    value={destinationQuery}
                    onChange={(e) => {
                      setDestinationQuery(e.target.value);
                      setCity("");
                    }}
                    placeholder={t("searchDestinations")}
                    className="h-full w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted"
                    autoFocus
                  />
                </label>

                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={() => pickCity("")}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                      !city && !destinationQuery
                        ? "bg-[#f3f6ff]"
                        : "hover:bg-[#f7f7f7]"
                    }`}
                  >
                    <span className="neo-icon-btn !h-11 !w-11">
                      <Globe2 className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        {t("anywhere")}
                      </span>
                      <span className="block text-xs text-muted">
                        {t("homesSubtitle")}
                      </span>
                    </span>
                  </button>

                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickCity(c)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                        city === c ? "bg-[#f3f6ff]" : "hover:bg-[#f7f7f7]"
                      }`}
                    >
                      <span className="neo-icon-btn !h-11 !w-11 text-sm font-semibold">
                        {c.slice(0, 1)}
                      </span>
                      <span className="text-sm font-medium">{c}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-base font-semibold">{t("dealType")}</h3>
                  <div className="scrollbar-hide flex gap-2.5 overflow-x-auto py-1">
                    {(
                      [
                        { value: "", label: t("anyDeal"), icon: Globe2 },
                        { value: "rent", label: t("rent"), icon: KeyRound },
                        { value: "sell", label: t("sell"), icon: Tag },
                      ] as const
                    ).map((opt) => {
                      const Icon = opt.icon;
                      const active = dealType === opt.value;
                      return (
                        <button
                          key={opt.value || "any"}
                          type="button"
                          onClick={() => setDealType(opt.value)}
                          className={`neo-chip ${active ? "neo-chip-active" : ""}`}
                        >
                          <Icon className="h-4 w-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 rounded-none bg-white/95 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCity("");
                    setDestinationQuery("");
                    setDealType("");
                    selectTab("all");
                  }}
                  className="text-sm font-semibold underline underline-offset-2"
                >
                  {t("clear")}
                </button>
                <button
                  type="button"
                  onClick={apply}
                  className="inline-flex h-12 min-w-[8.5rem] items-center justify-center gap-2 rounded-xl bg-brand px-6 text-base font-semibold text-white transition hover:bg-brand-dark"
                >
                  <Search className="h-4 w-4" />
                  {t("search")}
                </button>
              </div>
            </div>
          </div>,
            document.body,
          )}
      </>
    );
  }

  return (
    <div className="neo-surface mx-auto flex w-full max-w-3xl items-center overflow-visible rounded-full">
      <Fields />
      <div className="shrink-0 p-2 pr-2">
        <button
          type="button"
          onClick={apply}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-5 font-semibold text-white transition hover:bg-brand-dark"
          aria-label={t("search")}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">{t("search")}</span>
        </button>
      </div>
    </div>
  );
}
