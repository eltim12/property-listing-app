"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LangToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: "en" | "zh") {
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="neo-surface inline-flex h-10 items-center rounded-full p-1 text-sm">
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={`rounded-full px-3.5 py-1.5 font-medium transition duration-180 ${
          locale === "en"
            ? "bg-[#f3f6ff] text-brand shadow-[inset_1px_1px_3px_rgba(37,99,235,0.08)]"
            : "text-muted hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchTo("zh")}
        className={`rounded-full px-3.5 py-1.5 font-medium transition duration-180 ${
          locale === "zh"
            ? "bg-[#f3f6ff] text-brand shadow-[inset_1px_1px_3px_rgba(37,99,235,0.08)]"
            : "text-muted hover:text-foreground"
        }`}
      >
        中文
      </button>
    </div>
  );
}
