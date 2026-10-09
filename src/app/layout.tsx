import type { Metadata } from "next";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { LangProvider } from "@/i18n";

export const metadata: Metadata = {
  title: "The $800M Receipt: where Ottawa's AI money went",
  description:
    "Of the $800M+ Ottawa spent on AI since 2023, what share went to Canadian vendors vs foreign ones? Contract-by-contract vendor list with ownership coding, treemap, REST API, OpenAPI docs, and MCP tools. Open data, MIT licensed.",
  metadataBase: new URL("https://aispend.canada.nshipyard.com"),
  openGraph: {
    title: "The $800M Receipt: where Ottawa's AI money went",
    description:
      "Ottawa spent $800M+ on AI since 2023. We matched every contract to its real owner, Canadian or foreign, contract by contract.",
    type: "website",
    images: [{ url: "/og-card.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The $800M Receipt: where Ottawa's AI money went",
    description:
      "Ottawa spent $800M+ on AI since 2023. We matched every contract to its real owner, Canadian or foreign, contract by contract.",
    images: ["/og-card.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      "/favicon.ico",
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
