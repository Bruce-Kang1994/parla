"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Globe } from "lucide-react";

const LOCALE_LABELS: Record<string, string> = {
  zh: "中文",
  en: "EN",
  ja: "日本語",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: e.target.value });
  }

  return (
    <div className="relative flex items-center">
      <Globe className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
      <select
        value={locale}
        onChange={handleChange}
        className="appearance-none bg-surface border border-border rounded-lg pl-8 pr-6 py-1.5 text-xs font-medium text-foreground cursor-pointer hover:bg-surface-hover transition-colors focus:outline-none focus:ring-1 focus:ring-accent/50"
      >
        {Object.entries(LOCALE_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <svg className="w-3 h-3 text-muted-foreground absolute right-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
