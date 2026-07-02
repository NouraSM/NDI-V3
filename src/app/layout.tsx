import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });

export const metadata: Metadata = {
  title: "Sutherland | Enterprise Data Management Office",
  description: "NDI compliance assessment across 14 data management domains",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
