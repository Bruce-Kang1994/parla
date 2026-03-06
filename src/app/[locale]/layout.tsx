import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parla — Speak. It's written.",
  description:
    "AI voice dictation that actually understands you. Speak naturally, get polished text instantly. Removes filler words, formats your speech, and adapts to any context.",
  keywords: ["voice dictation", "speech to text", "AI", "voice input", "transcription"],
  openGraph: {
    title: "Parla — Speak. It's written.",
    description: "AI voice dictation that removes filler words, fixes grammar, and formats your speech into clean text — instantly.",
    type: "website",
    siteName: "Parla",
  },
  twitter: {
    card: "summary_large_image",
    title: "Parla — Speak. It's written.",
    description: "AI voice dictation that removes filler words, fixes grammar, and formats your speech into clean text — instantly.",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
