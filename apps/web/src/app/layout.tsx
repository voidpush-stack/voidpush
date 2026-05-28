import type { Metadata } from "next";
import "../styles/globals.css";
import "./shared.css";

export const metadata: Metadata = {
  title: "VoidPush — Anonymous Code. Pure Signal.",
  description: "Anonymous code contribution network. No usernames. No history. No bias.",
  openGraph: {
    title: "VoidPush — Anonymous Code. Pure Signal.",
    description: "Push code without revealing your identity. Code speaks. Identities don't.",
    url: "https://voidpush.dev",
    siteName: "VoidPush",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
