"use client";

import { Languages, MessageCircle, Search, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { ContactSettings } from "@/lib/api";

type Props = {
  contact?: ContactSettings | null;
  hideOnPaths?: boolean;
};

export function BottomNav({ contact }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [contactOpen, setContactOpen] = useState(false);

  const onExplore =
    pathname === "/" ||
    pathname.endsWith("/search") ||
    pathname.includes("/search");
  const onListing = pathname.includes("/listings/");

  useEffect(() => {
    if (!contactOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [contactOpen]);

  if (onListing) return null;

  const phone = contact?.contact_phone || "";
  const wa = (contact?.contact_whatsapp || phone).replace(/[^\d]/g, "");

  function switchLang() {
    const next = locale === "en" ? "zh" : "en";
    router.replace(pathname, { locale: next });
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-[var(--background)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid h-16 grid-cols-3">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
              onExplore && !pathname.includes("/search")
                ? "text-brand"
                : "text-muted"
            }`}
          >
            <Search className="h-6 w-6" strokeWidth={onExplore ? 2.25 : 1.75} />
            {t("navExplore")}
          </Link>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted"
          >
            <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
            {t("navContact")}
          </button>
          <button
            type="button"
            onClick={switchLang}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted"
          >
            <Languages className="h-6 w-6" strokeWidth={1.75} />
            {t("navLanguage")}
          </button>
        </div>
      </nav>

      {contactOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("close")}
            onClick={() => setContactOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200" />
            <h2 className="mb-1 text-lg font-semibold">{t("contact")}</h2>
            <p className="mb-5 text-sm text-muted">
              {contact?.contact_name || "—"}
            </p>
            <div className="space-y-3">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border font-semibold"
                >
                  <Phone className="h-4 w-4" />
                  {t("call")}
                </a>
              )}
              {wa && (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] font-semibold text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("whatsapp")}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
