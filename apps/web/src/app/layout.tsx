import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import "./shared.css";

export const viewport: Viewport = {
  themeColor: "#080b10",
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://voidpush.dev"),
  title: {
    default: "VoidPush - Anonymous Code. Pure Signal.",
    template: "%s | VoidPush",
  },
  description:
    "Anonymous code contribution network. Strip your identity, push through relay nodes, get reviewed on merit alone. No usernames. No history. No bias.",
  keywords: [
    "anonymous code review",
    "anonymous git",
    "blind code review",
    "privacy",
    "open source",
    "voidpush",
    "void push",
  ],
  authors: [{ name: "VoidPush", url: "https://voidpush.dev" }],
  creator: "VoidPush",
  publisher: "VoidPush",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://voidpush.dev",
    siteName: "VoidPush",
    title: "VoidPush - Anonymous Code. Pure Signal.",
    description: "Push code without revealing your identity. Reviewed blind. Judged on merit.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VoidPush - Anonymous Code. Pure Signal.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VoidPush - Anonymous Code. Pure Signal.",
    description: "Push code without revealing your identity. Reviewed blind. Judged on merit.",
    images: ["/og-image.png"],
    creator: "@voidpush_",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://voidpush.dev",
    languages: {
      "en-US": "https://voidpush.dev",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
