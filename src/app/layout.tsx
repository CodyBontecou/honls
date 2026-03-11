import type { Metadata } from "next";
import { Cinzel, Lora } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { SessionProvider } from "next-auth/react";

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Honl's Beach Bodyboarding Classic | Kailua-Kona, Hawai'i",
  description: "Join the premier bodyboarding competition at Honl's Beach, Kailua-Kona, Hawai'i. Free entry across all divisions. Celebrating the spirit of Hawaiian watermanship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${lora.variable} antialiased`}>
        <SessionProvider>
          <div className="noise-overlay" />
          <Navigation />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
