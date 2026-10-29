import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/fredoka";
import "./globals.css";
import { Providers } from "@/components/providers";
export const metadata: Metadata = {
  title: {
    default: "Betoot – Wissen trifft Bauchkribbeln.",
    template: "%s · Betoot",
  },
  description:
    "Dein Quiz wird zur Spielshow. Spiel erstellen oder mit Code beitreten – ohne Anmeldung. Mit Avataren, virtuellen Coins und grossen Aha-Momenten.",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
