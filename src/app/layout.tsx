import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Honl's Beach Bodyboarding Classic | Kailua-Kona, Hawai'i",
  description: "Join the premier bodyboarding competition at Honl's Beach, Kailua-Kona, Hawai'i. Free entry across all divisions. Celebrating the spirit of Hawaiian watermanship.",
};

// This root layout is minimal - actual layout is in [locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
